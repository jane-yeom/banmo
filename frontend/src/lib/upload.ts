const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1200;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIMENSION) { h = Math.round(h * MAX_DIMENSION / w); w = MAX_DIMENSION; }
      if (h > MAX_DIMENSION) { w = Math.round(w * MAX_DIMENSION / h); h = MAX_DIMENSION; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        0.85,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadFile(
  file: File,
  folder: string = 'uploads',
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('파일 크기는 5MB 이하만 가능합니다');
  }

  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImage(file);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);

  const token = localStorage.getItem('accessToken');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${API_URL}/media/upload?folder=${folder}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '파일 업로드 실패');
  }

  const data = await res.json();
  return data.data.url;
}

export async function uploadImage(file: File): Promise<string> {
  return uploadFile(file, 'images');
}

export async function uploadVideo(file: File): Promise<string> {
  return uploadFile(file, 'videos');
}
