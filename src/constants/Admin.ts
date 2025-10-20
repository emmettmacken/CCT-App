export const categoryOptions = ["Clinical Exam", "Lab Test", "Imaging", "Other"];

export const generateId = (prefix = "") =>
  `${prefix}${Math.random().toString(36).substring(2, 9)}`;