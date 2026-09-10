export function persistItemList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return;
  } catch (error) {
    if (error?.name !== 'QuotaExceededError') return;
  }

  const compactItems = items.map(item => ({
    ...item,
    img: typeof item.img === 'string' && item.img.startsWith('data:')
      ? '/images/default.jpg'
      : item.img
  }));

  try {
    localStorage.setItem(key, JSON.stringify(compactItems));
  } catch (error) {
    // Catalog state remains available in memory when browser storage is full.
  }
}

export function readImageAsDataUrl(file, maxDimension = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to read image'));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
