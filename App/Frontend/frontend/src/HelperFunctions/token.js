const STORAGE_KEY = "YoloModelAnomolyDetectorSiteToken";

export const getToken = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const tokenObject = JSON.parse(stored);

  const now = Date.now();
  if (now > tokenObject.expireAt) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return tokenObject.token;
};

export const setToken = (token) => {
  const expireAt = Date.now() + 10 * 60 * 1000; // expires in 10 minute

  const tokenObject = {
    token,
    expireAt,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenObject));
};

export const removeToken = (token) => {
  localStorage.removeItem(STORAGE_KEY);
};
