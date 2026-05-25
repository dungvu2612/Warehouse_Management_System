package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'bom'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewBOMRepository
- CreateWithItems
- UpdateWithItems
- DeleteByID
- FindAll
- FindByID
- FindItemsByBOMID

Luu y khi sua:
- Giu nguyen invariant: parent FINISHED_GOOD, components COMPONENT; day la rule nghiep vu cot loi.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// BOMCreateItemInput biểu diễn 1 dòng component đầu vào để tạo BOM.
type BOMCreateItemInput struct {
	ComponentProductID uint
	Quantity           int
}

// BOMCreateInput biểu diễn payload nghiệp vụ tạo BOM.
type BOMCreateInput struct {
	ProductID   uint
	BOMName     string
	Description string
	CreatedBy   uint
	Items       []BOMCreateItemInput
}

// BOMUpdateInput biểu diễn payload nghiệp vụ cập nhật BOM.
type BOMUpdateInput struct {
	BOMID       uint
	ProductID   uint
	BOMName     string
	Description string
	Items       []BOMCreateItemInput
}

// BOMListFilters gom các filter khi đọc danh sách BOM.
type BOMListFilters struct {
	ProductID *uint
}

// BOMRepository định nghĩa lớp truy cập dữ liệu cho module BOM.
type BOMRepository interface {
	CreateWithItems(input BOMCreateInput) (*models.BOM, error)
	UpdateWithItems(input BOMUpdateInput) (*models.BOM, error)
	DeleteByID(id uint) error
	FindAll(filters BOMListFilters) ([]models.BOM, error)
	FindByID(id uint) (*models.BOM, error)
	FindItemsByBOMID(bomID uint) ([]models.BOMItem, error)
}

// Nhóm lỗi domain cho module BOM ở tầng repository.
var (
	ErrBOMNotFound                   = errors.New("bom not found")
	ErrBOMDuplicateComponent         = errors.New("duplicate component in BOM")
	ErrBOMParentProductNotFound      = errors.New("parent product not found or inactive")
	ErrBOMComponentProductsNotFound  = errors.New("one or more component products not found or inactive")
	ErrBOMParentMustBeFinishedGood   = errors.New("parent product must be FINISHED_GOOD")
	ErrBOMComponentsMustBeComponents = errors.New("all components must have product_type COMPONENT")
)

type bomRepository struct {
	db *gorm.DB
}

// NewBOMRepository khởi tạo repository cho module BOM.
func NewBOMRepository(db *gorm.DB) BOMRepository {
	return &bomRepository{db: db}
}

// validateProductsForBOM validate product cha + toàn bộ component theo rule BOM.
func (r *bomRepository) validateProductsForBOM(tx *gorm.DB, productID uint, items []BOMCreateItemInput) error {
	// 1) Validate product cha phải tồn tại và đang active.
	var parentProduct models.Product
	if err := tx.Where("id = ? AND is_active = ?", productID, true).First(&parentProduct).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrBOMParentProductNotFound
		}
		return err
	}

	// 2) Product cha của BOM phải là thành phẩm (FINISHED_GOOD).
	if strings.ToUpper(strings.TrimSpace(parentProduct.ProductType)) != "FINISHED_GOOD" {
		return ErrBOMParentMustBeFinishedGood
	}

	// 3) Gom danh sách component ID từ request.
	componentIDs := make([]uint, 0, len(items))
	for _, item := range items {
		componentIDs = append(componentIDs, item.ComponentProductID)
	}

	// 4) Validate toàn bộ component phải tồn tại và active.
	var activeComponents []models.Product
	if err := tx.Where("id IN ? AND is_active = ?", componentIDs, true).Find(&activeComponents).Error; err != nil {
		return err
	}
	if len(activeComponents) != len(componentIDs) {
		return ErrBOMComponentProductsNotFound
	}

	// 5) Validate component phải có product_type = COMPONENT.
	componentMap := make(map[uint]models.Product, len(activeComponents))
	for _, product := range activeComponents {
		componentMap[product.ID] = product
	}
	for _, componentID := range componentIDs {
		product := componentMap[componentID]
		if strings.ToUpper(strings.TrimSpace(product.ProductType)) != "COMPONENT" {
			return ErrBOMComponentsMustBeComponents
		}
	}

	return nil
}

// CreateWithItems tạo BOM header + BOM items trong cùng transaction.
func (r *bomRepository) CreateWithItems(input BOMCreateInput) (*models.BOM, error) {
	var created models.BOM

	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := r.validateProductsForBOM(tx, input.ProductID, input.Items); err != nil {
			return err
		}

		// 6) Tạo BOM header.
		bom := models.BOM{
			ProductID:   input.ProductID,
			BOMName:     input.BOMName,
			Description: input.Description,
		}
		if input.CreatedBy > 0 {
			createdBy := input.CreatedBy
			bom.CreatedBy = &createdBy
		}
		if err := tx.Create(&bom).Error; err != nil {
			return err
		}

		// 7) Tạo danh sách BOM items.
		items := make([]models.BOMItem, 0, len(input.Items))
		for _, item := range input.Items {
			items = append(items, models.BOMItem{
				BOMID:              bom.ID,
				ComponentProductID: item.ComponentProductID,
				Quantity:           item.Quantity,
			})
		}
		if err := tx.Create(&items).Error; err != nil {
			if isUniqueConstraintError(err) {
				return ErrBOMDuplicateComponent
			}
			return err
		}

		// 8) Load lại BOM để response có sẵn thông tin quan hệ.
		if err := tx.Preload("Product").Preload("Creator").Preload("Items").First(&bom, bom.ID).Error; err != nil {
			return err
		}

		created = bom
		return nil
	})
	if err != nil {
		if isUniqueConstraintError(err) {
			return nil, ErrBOMDuplicateComponent
		}
		return nil, err
	}

	return &created, nil
}

// UpdateWithItems cập nhật BOM header + replace BOM items trong cùng transaction.
func (r *bomRepository) UpdateWithItems(input BOMUpdateInput) (*models.BOM, error) {
	var updated models.BOM

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1) Lock BOM row để tránh race condition update đồng thời.
		var bom models.BOM
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&bom, input.BOMID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBOMNotFound
			}
			return err
		}

		if err := r.validateProductsForBOM(tx, input.ProductID, input.Items); err != nil {
			return err
		}

		// 2) Update header.
		bom.ProductID = input.ProductID
		bom.BOMName = input.BOMName
		bom.Description = input.Description
		if err := tx.Save(&bom).Error; err != nil {
			return err
		}

		// 3) Xóa toàn bộ items cũ rồi tạo lại theo payload mới.
		if err := tx.Where("bom_id = ?", bom.ID).Delete(&models.BOMItem{}).Error; err != nil {
			return err
		}

		items := make([]models.BOMItem, 0, len(input.Items))
		for _, item := range input.Items {
			items = append(items, models.BOMItem{
				BOMID:              bom.ID,
				ComponentProductID: item.ComponentProductID,
				Quantity:           item.Quantity,
			})
		}
		if err := tx.Create(&items).Error; err != nil {
			if isUniqueConstraintError(err) {
				return ErrBOMDuplicateComponent
			}
			return err
		}

		// 4) Load lại BOM đã update để response đầy đủ.
		if err := tx.Preload("Product").Preload("Creator").Preload("Items").First(&bom, bom.ID).Error; err != nil {
			return err
		}

		updated = bom
		return nil
	})
	if err != nil {
		if isUniqueConstraintError(err) {
			return nil, ErrBOMDuplicateComponent
		}
		return nil, err
	}

	return &updated, nil
}

// DeleteByID xóa BOM và toàn bộ BOM items liên quan trong cùng transaction.
func (r *bomRepository) DeleteByID(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("bom_id = ?", id).Delete(&models.BOMItem{}).Error; err != nil {
			return err
		}

		result := tx.Where("id = ?", id).Delete(&models.BOM{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrBOMNotFound
		}

		return nil
	})
}

// FindAll lấy danh sách BOM và preload Product/Creator/Items cho màn list.
func (r *bomRepository) FindAll(filters BOMListFilters) ([]models.BOM, error) {
	var boms []models.BOM
	query := r.db.Model(&models.BOM{}).
		Preload("Product").
		Preload("Creator").
		Preload("Items").
		Order("id DESC")

	if filters.ProductID != nil {
		query = query.Where("product_id = ?", *filters.ProductID)
	}

	if err := query.Find(&boms).Error; err != nil {
		return nil, err
	}
	return boms, nil
}

// FindByID lấy BOM theo ID và preload Product/Creator.
func (r *bomRepository) FindByID(id uint) (*models.BOM, error) {
	var bom models.BOM
	if err := r.db.Preload("Product").Preload("Creator").First(&bom, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBOMNotFound
		}
		return nil, err
	}
	return &bom, nil
}

// FindItemsByBOMID lấy danh sách component của 1 BOM.
func (r *bomRepository) FindItemsByBOMID(bomID uint) ([]models.BOMItem, error) {
	var items []models.BOMItem
	if err := r.db.Where("bom_id = ?", bomID).
		Preload("ComponentProduct").
		Order("id ASC").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
