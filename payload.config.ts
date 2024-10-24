import path from 'path'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from 'payload/i18n/en'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig, CollectionSlug } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  //editor: slateEditor({}),
  editor: lexicalEditor(),
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          name: 'pages',
          label: 'pages order',
          type: 'relationship',
          relationTo: 'pages',
          hasMany: true,
        },
        {
          name: 'users',
          label: 'users order',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
        },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req }) => {
            try {
              const collections: CollectionSlug[] = ['pages', 'users']

              for (const collection of collections) {
                if (doc[collection].length > 0) {
                  console.log('start query...')
                  await req.payload.update({
                    collection,
                    where: {
                      id: {
                        in: doc[collection],
                      },
                    },
                    data: {
                      featured: true,
                    },
                  })
                  console.log('end query... (never shows)')
                }
              }
            } catch (error) {
              console.log(error)
            }
          },
        ],
      },
    },
  ],
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'featured',
          type: 'checkbox',
        },
      ],
    },
    {
      slug: 'pages',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'richText',
        },
        {
          name: 'featured',
          type: 'checkbox',
        },
      ],
      // hooks: {
      //   beforeChange: [
      //     async ({ data, originalDoc = {}, req }) => {
      //       try {
      //         console.log('pages beforeChange: start queries...')
      //         const pages = await req.payload.find({
      //           collection: 'pages',
      //           pagination: false,
      //         })

      //         const users = await req.payload.find({
      //           collection: 'users',
      //           pagination: false,
      //         })

      //         console.log('pages beforeChange: finished queries...')
      //       } catch (error) {
      //         console.log(error)
      //       }
      //     },
      //   ],
      // },
    },
    {
      slug: 'media',
      upload: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI || '',
    },
  }),
  // db: mongooseAdapter({
  //   url: process.env.MONGODB_URI || '',
  // }),
  /**
   * Payload can now accept specific translations from 'payload/i18n/en'
   * This is completely optional and will default to English if not provided
   */
  i18n: {
    supportedLanguages: { en },
  },

  admin: {
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  async onInit(payload) {
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })
    }
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
})
