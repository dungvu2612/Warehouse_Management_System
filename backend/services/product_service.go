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
	"fmt"
	"strings"
	"unicode"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
)

const (
	ProductTypeComponent    = "COMPONENT"
	ProductTypeFinishedGood = "FINISHED_GOOD"
)

// ProductInput là DTO nghiệp vụ cho create/update.
type ProductInput struct {
	ProductCode     string
	ProductName     string
	ProductType     string
	Description     string
	Unit            string
	MinStock        int
	Price           float64
}

// ProductService định nghĩa business logic cho module products.
type ProductService interface {
	Create(input ProductInput) (*models.Product, error)
	GetAllActive() ([]models.Product, error)
	GetByID(id uint) (*models.Product, error)
	Update(id uint, input ProductInput) (*models.Product, error)
	Delete(id uint) error
	PreviewCode(productType string, productName string) (string, error)
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

	// Retry de tranh race condition khi tao cung luc va trung product_code.
	for attempt := 0; attempt < 5; attempt++ {
		generatedCode, err := s.GenerateFinalCode(normalized.ProductType, normalized.ProductName)
		if err != nil {
			return nil, err
		}

		product := &models.Product{
			ProductCode: generatedCode,
			ProductName: normalized.ProductName,
			ProductType: normalized.ProductType,
			Description: normalized.Description,
			Unit:        normalized.Unit,
			MinStock:    normalized.MinStock,
			Price:       normalized.Price,
			IsActive:    true,
		}

		if err := s.repo.Create(product); err != nil {
			if errors.Is(err, repositories.ErrProductEntityCodeExists) {
				continue
			}
			return nil, err
		}

		return product, nil
	}

	return nil, repositories.ErrProductEntityCodeExists
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

func (s *productService) PreviewCode(productType string, productName string) (string, error) {
	normalizedType := strings.ToUpper(strings.TrimSpace(productType))
	normalizedName := strings.TrimSpace(productName)

	if normalizedType == "" {
		normalizedType = ProductTypeComponent
	}
	if normalizedName == "" {
		return "", ErrInvalidProductPayload
	}

	return s.GenerateFinalCode(normalizedType, normalizedName)
}

func normalizeAndValidateInput(input ProductInput) (ProductInput, error) {
	input.ProductName = strings.TrimSpace(input.ProductName)
	input.ProductType = strings.ToUpper(strings.TrimSpace(input.ProductType))
	input.Description = strings.TrimSpace(input.Description)
	input.Unit = strings.TrimSpace(input.Unit)
	input.ProductCode = strings.ToUpper(strings.TrimSpace(input.ProductCode))

	if input.ProductName == "" {
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

// GenerateFinalCode sinh product_code theo format: PREFIX-ABBREVIATION-SEQ.
func (s *productService) GenerateFinalCode(productType string, productName string) (string, error) {
	prefix, err := mapProductTypeToPrefix(productType)
	if err != nil {
		return "", err
	}

	abbreviation := buildNameAbbreviation(productName)
	if abbreviation == "" {
		return "", errors.New("cannot generate product_code abbreviation from product_name")
	}

	codeBase := fmt.Sprintf("%s-%s", prefix, abbreviation)

	maxSeq, err := s.repo.FindMaxSequenceByCodeBase(codeBase)
	if err != nil {
		return "", err
	}

	nextSeq := maxSeq + 1
	return fmt.Sprintf("%s-%03d", codeBase, nextSeq), nil
}

func mapProductTypeToPrefix(productType string) (string, error) {
	switch strings.ToUpper(strings.TrimSpace(productType)) {
	case ProductTypeFinishedGood:
		return "TP", nil
	case ProductTypeComponent:
		return "LK", nil
	default:
		return "", ErrInvalidProductType
	}
}

func buildNameAbbreviation(productName string) string {
	normalized := normalizeVietnamese(productName)
	if normalized == "" {
		return ""
	}

	words := strings.Fields(normalized)
	if len(words) == 0 {
		return ""
	}

	parts := make([]string, 0, len(words))
	tails := make([]string, 0, len(words))
	for _, word := range words {
		if word == "" {
			continue
		}

		wordRunes := []rune(word)
		initial := string(wordRunes[0])
		rest := stripVowels(string(wordRunes[1:]))

		part := strings.ToUpper(initial)
		part = keepOnlyAlnum(part)
		if part != "" {
			parts = append(parts, part)
		}
		if rest != "" {
			tails = append(tails, strings.ToUpper(keepOnlyAlnum(rest)))
		}
	}

	if len(parts) == 0 {
		return ""
	}

	abbr := strings.Join(parts, "")
	// Nếu tên quá ngắn (ví dụ chỉ 1 từ), ghép thêm phụ âm để mã dễ phân biệt hơn.
	if len(abbr) < 3 && len(tails) > 0 {
		for _, tail := range tails {
			if tail == "" {
				continue
			}
			abbr += tail
			if len(abbr) >= 3 {
				break
			}
		}
	}

	if len(abbr) > 10 {
		abbr = abbr[:10]
	}

	return abbr
}

func normalizeVietnamese(value string) string {
	s := strings.ToLower(strings.TrimSpace(value))
	if s == "" {
		return ""
	}

	replacer := strings.NewReplacer(
		"à", "a", "á", "a", "ạ", "a", "ả", "a", "ã", "a",
		"ă", "a", "ằ", "a", "ắ", "a", "ặ", "a", "ẳ", "a", "ẵ", "a",
		"â", "a", "ầ", "a", "ấ", "a", "ậ", "a", "ẩ", "a", "ẫ", "a",
		"è", "e", "é", "e", "ẹ", "e", "ẻ", "e", "ẽ", "e",
		"ê", "e", "ề", "e", "ế", "e", "ệ", "e", "ể", "e", "ễ", "e",
		"ì", "i", "í", "i", "ị", "i", "ỉ", "i", "ĩ", "i",
		"ò", "o", "ó", "o", "ọ", "o", "ỏ", "o", "õ", "o",
		"ô", "o", "ồ", "o", "ố", "o", "ộ", "o", "ổ", "o", "ỗ", "o",
		"ơ", "o", "ờ", "o", "ớ", "o", "ợ", "o", "ở", "o", "ỡ", "o",
		"ù", "u", "ú", "u", "ụ", "u", "ủ", "u", "ũ", "u",
		"ư", "u", "ừ", "u", "ứ", "u", "ự", "u", "ử", "u", "ữ", "u",
		"ỳ", "y", "ý", "y", "ỵ", "y", "ỷ", "y", "ỹ", "y",
		"đ", "d",
	)
	s = replacer.Replace(s)

	out := strings.Builder{}
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) || r == '-' {
			out.WriteRune(r)
		} else {
			out.WriteRune(' ')
		}
	}

	return strings.TrimSpace(out.String())
}

func stripVowels(value string) string {
	if value == "" {
		return ""
	}
	out := strings.Builder{}
	for _, r := range value {
		switch r {
		case 'a', 'e', 'i', 'o', 'u', 'y':
			continue
		default:
			out.WriteRune(r)
		}
	}
	return out.String()
}

func keepOnlyAlnum(value string) string {
	out := strings.Builder{}
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			out.WriteRune(r)
		}
	}
	return out.String()
}
