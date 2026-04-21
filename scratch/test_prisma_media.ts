import { prisma } from '../src/utils/prisma'

async function test() {
  try {
    // Testing if 'media' is available on prisma instance
    // @ts-ignore - ignoring type error to see if it works at runtime
    const count = await prisma.media.count()
    console.log('Media count:', count)
  } catch (error: any) {
    console.error('Error accessing prisma.media:', error.message)
  }
}

test()
