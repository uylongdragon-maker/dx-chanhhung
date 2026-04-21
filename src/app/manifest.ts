import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tuổi Trẻ Số Chánh Hưng',
    short_name: 'DX Chánh Hưng',
    description: 'Trạm hành dinh số của Ban Truyền thông',
    start_url: '/workspace',
    display: 'standalone', // Bỏ thanh địa chỉ web, chạy full màn hình như app xịn
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
