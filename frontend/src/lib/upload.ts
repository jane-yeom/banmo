export async function uploadFile(
  file: File,
  folder: string = 'uploads',
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

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
