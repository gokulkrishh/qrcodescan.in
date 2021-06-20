export const isURL = (url = '') => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const protocol = '^(https?:\\/\\/)?';
  const domain = '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|';
  const ip = '((\\d{1,3}\\.){3}\\d{1,3}))';
  const port = '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*';
  const queryString = '(\\?[;&a-z\\d%_.~+=-]*)?';
  const fragmentLocater = '(\\#[-a-z\\d_]*)?$';

  const regex = new RegExp(`${protocol + domain + ip + port + queryString + fragmentLocater}`, 'i');

  return regex.test(url);
};

export const hasProtocolInUrl = (url = '') => {
  const protocol = '^(https?:\\/\\/)';
  const regex = new RegExp(protocol, 'i');
  return regex.test(url);
};
