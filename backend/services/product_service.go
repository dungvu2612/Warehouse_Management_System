package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'product'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewProductService
- Create
- GetAllActive
- GetByID
- Update
- Delete
- normalizeAndValidateInput

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

const (
	ProductTypeComponent    = "COMPONENT"
	ProductTypeFinishedGood = "FINISHED_GOOD"
)

// ProductInput là DTO nghiệp vụ cho create/update.
type ProductInput struct {
	ProductCode string
	ProductName string
	ProductType string
	Description string
	Unit        string
	MinStock    int
	Price       float64
}

// ProductService định nghĩa business logic cho module products.
type ProductService interface {
	Create(input ProductInput) (*models.Product, error)
	GetAllActive() ([]models.Product, error)
	GetByID(id uint) (*models.Product, error)
	Update(id uint, input ProductInput) (*models.Product, error)
	Delete(id uint) error
}

type productService struct {
	repo repositories.ProductRepository
}

func NewProductService(repo repositories.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) Create(input ProductInput) (*models.Product, error) {
	normalized, err := normalizeAndValidateInput(input)
	if err != nil {
		return nil, err
	}

	product := &models.Product{
		ProductCode: normalized.ProductCode,
		ProductName: normalized.ProductName,
		ProductType: normalized.ProductType,
		Description: normalized.Description,
		Unit:        normalized.Unit,
		MinStock:    normalized.MinStock,
		Price:       normalized.Price,
		IsActive:    true,
	}

	if err := s.repo.Create(product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) GetAllActive() ([]models.Product, error) {
	return s.repo.FindAllActive()
}

func (s *productService) GetByID(id uint) (*models.Product, error) {
	if id == 0 {
		return nil, ErrInvalidProductID
	}
	return s.repo.FindActiveByID(id)
}

func (s *productService) Update(id uint, input ProductInput) (*models.Product, error) {
	if id == 0 {
		return nil, ErrInvalidProductID
	}

	normalized, err := normalizeAndValidateInput(input)
	if err != nil {
		return nil, err
	}

	product, err := s.repo.FindActiveByID(id)
	if err != nil {
		return nil, err
	}

	product.ProductCode = normalized.ProductCode
	product.ProductName = normalized.ProductName
	product.ProductType = normalized.ProductType
	product.Description = normalized.Description
	product.Unit = normalized.Unit
	product.MinStock = normalized.MinStock
	product.Price = normalized.Price

	if err := s.repo.Update(product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *productService) Delete(id uint) error {
	if id == 0 {
		return ErrInvalidProductID
	}
	return s.repo.SoftDeleteByID(id)
}

func normalizeAndValidateInput(input ProductInput) (ProductInput, error) {
	input.ProductCode = strings.TrimSpace(input.ProductCode)
	input.ProductName = strings.TrimSpace(input.ProductName)
	input.ProductType = strings.ToUpper(strings.TrimSpace(input.ProductType))
	input.Description = strings.TrimSpace(input.Description)
	input.Unit = strings.TrimSpace(input.Unit)

	if input.ProductCode == "" || input.ProductName == "" {
		return ProductInput{}, ErrInvalidProductPayload
	}

	if input.Unit == "" {
		input.Unit = "pcs"
	}

	if input.ProductType == "" {
		input.ProductType = ProductTypeComponent
	}

	if input.ProductType != ProductTypeComponent && input.ProductType != ProductTypeFinishedGood {
		return ProductInput{}, ErrInvalidProductType
	}

	if input.MinStock < 0 || input.Price < 0 {
		return ProductInput{}, ErrInvalidProductPayload
	}

	return input, nil
}

var (
	ErrInvalidProductID      = errors.New("invalid product id")
	ErrInvalidProductType    = errors.New("product_type must be COMPONENT or FINISHED_GOOD")
	ErrInvalidProductPayload = errors.New("invalid product payload")
)
