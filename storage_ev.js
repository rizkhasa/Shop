const gridFs = new(require('../../lib/system/bucket'))
const streamifier = require('streamifier')
const tmp = require('os').tmpdir()
const path = require('path')
const fs = require('fs')
exports.run = {
   async: async (m, {
      client,
      body,
      Func
   }) => {
      try {
         if (!process.env.DATABASE_URL) return
         await gridFs.createBucket()
         let database = []
         const cursor = gridFs.action.find({})
         for await (const doc of cursor) {
            database.push(doc)
         }
         const files = database.find(v => body && v.metadata.name == body.toLowerCase())
         if (files) {
            if (/audio/.test(files.metadata.mime)) {
               gridFs.action.openDownloadStreamByName(files.filename).pipe(fs.createWriteStream(path.join(tmp, files.filename)).on('finish', async () => {
                  const buffer = await fs.promises.readFile(path.join(tmp, files.filename))
                  client.sendFile(m.chat, buffer, files.filename, '', m, {
                     ptt: files.metadata.ptt
                  })
               }))
            } else if (/webp/.test(files.metadata.mime)) {
               gridFs.action.openDownloadStreamByName(files.filename).pipe(fs.createWriteStream(path.join(tmp, files.filename)).on('finish', async () => {
                  const buffer = await fs.promises.readFile(path.join(tmp, files.filename))
                  client.sendSticker(m.chat, buffer, m, {
                     packname: global.db.setting.sk_pack,
                     author: global.db.setting.sk_author
                  })
               }))
            } else {
               gridFs.action.openDownloadStreamByName(files.filename).pipe(fs.createWriteStream(path.join(tmp, files.filename)).on('finish', async () => {
                  const buffer = await fs.promises.readFile(path.join(tmp, files.filename))
                  client.sendFile(m.chat, buffer, files.filename, '', m)
               }))
            }
         }
      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   cache: true,
   location: __filename
}