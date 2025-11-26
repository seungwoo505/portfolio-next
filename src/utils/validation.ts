export interface ValidationError {
  field: string;
  message: string;
}
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName}을(를) 입력해주세요.`;
  }
  return null;
};
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
};
export const validateUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch {
    return '올바른 URL 형식이 아닙니다.';
  }
};
export const validateDateRange = (startDate: string, endDate: string): string | null => {
  if (startDate && endDate && startDate > endDate) {
    return '시작일은 종료일보다 이전이어야 합니다.';
  }
  return null;
};
export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.length < minLength) {
    return `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`;
  }
  return null;
};
export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) {
    return `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`;
  }
  return null;
};
