// src/utils/auth.js
export const isLoggedIn = () => {
  return !!localStorage.getItem("user");
};

export const logout = () => {
  localStorage.removeItem("user");
};
