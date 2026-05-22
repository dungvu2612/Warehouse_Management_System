package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'product'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewProductRepository
- Create
- FindAllActive
- FindActiveByID
- Update
- SoftDeleteByID
- isUniqueViolation

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/models"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// ProductRepository định nghĩa các thao tác data-access cho product.
type ProductRepository interface {
	Create(product *models.Product) error
	FindAllActive() ([]models.Product, error)
	FindActiveByID(id uint) (*models.Product, error)
	Update(product *models.Product) error
	SoftDeleteByID(id uint) error
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(product *models.Product) error {
	if err := r.db.Create(product).Error; err != nil {
		if isUniqueViolation(err) {
			return ErrProductEntityCodeExists
		}
		return err
	}
	return nil
}

func (r *productRepository) FindAllActive() ([]models.Product, error) {
	var products []models.Product
	if err := r.db.Where("is_active = ?", true).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *productRepository) FindActiveByID(id uint) (*models.Product, error) {
	var product models.Product
	if err := r.db.Where("id = ? AND is_active = ?", id, true).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductEntityNotFound
		}
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) Update(product *models.Product) error {
	if err := r.db.Save(product).Error; err != nil {
		if isUniqueViolation(err) {
			return ErrProductEntityCodeExists
		}
		return err
	}
	return nil
}

func (r *productRepository) SoftDeleteByID(id uint) error {
	product, err := r.FindActiveByID(id)
	if err != nil {
		return err
	}

	if err := r.db.Model(product).Update("is_active", false).Error; err != nil {
		return err
	}
	return nil
}

// Errors dùng chung giữa repository/service/handler để map HTTP status chuẩn.
var (
	ErrProductEntityNotFound   = errors.New("product not found")
	ErrProductEntityCodeExists = errors.New("product_code already exists")
)

func isUniqueViolation(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}

	return strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}
