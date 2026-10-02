export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Mengompresi dan mengubah ukuran gambar secara instan di browser
 * sebelum diunggah ke Supabase Storage.
 *
 * Mengurangi ukuran gambar dari 4MB - 10MB menjadi ~150KB - 250KB (hemat ~95% kuota storage)
 * dengan resolusi optimal (max 1200px) tanpa menurunkan keterbacaan laporan.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options

  // Jika bukan gambar biasa (misal GIF/SVG), biarkan file asli
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  // Jika ukuran file sudah sangat kecil (< 200 KB), tidak perlu kompresi ulang
  if (file.size <= 200 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Hitung rasio aspek proporsional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(file) // fallback aman
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Jika gagal atau ukurannya malah lebih besar, pakai file asli
              return resolve(file)
            }

            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => resolve(file) // fallback jika gagal render
    }

    reader.onerror = () => resolve(file) // fallback jika gagal membaca file
  })
}
