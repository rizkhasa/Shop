const fs = require('fs')
const { exec } = require('child_process')
const mime = require('mime-types')
const phone = require('awesome-phonenumber')
const moment = require('moment-timezone')
moment.tz.setDefault(global.timezone).locale('id')
const gridFs = new(require('../../lib/system/bucket'))
const streamifier = require('streamifier')
const tmp = require('os').tmpdir()
const path = require('path')

exports.run = {
   usage: ['storage'],
   hidden: ['save', 'getfile', 'delfile', 'files', 'drop'],
   category: 'miscs',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      isOwner,
      ctx,
      Func,
      Scraper
   }) => {
      try {
         if (!process.env.DATABASE_URL) return m.reply(Func.texted('bold', '🚩 You must use mongodb to use this feature.'))
         await gridFs.createBucket()
         const commands = ctx.commands
         if (command === 'save') {
            let q = m.quoted ? m.quoted : m
            if (/document/.test(q.mtype)) return client.reply(m.chat, Func.texted('bold', `🚩 Cannot save file in document format.`), m)
            if (/conversation|extended/.test(q.mtype)) return client.reply(m.chat, Func.texted('bold', `🚩 Media files not found.`), m)
            let file = await q.download()
            if (!text) return client.reply(m.chat, Func.texted('bold', `🚩 Give name of the file to be saved.`), m)
            if (text.length > 30) return client.reply(m.chat, Func.texted('bold', `🚩 File name is too long, max 30 characters.`), m)
            if (commands.includes(text)) return client.reply(m.chat, Func.texted('bold', `🚩 Unable to save file with name of bot command.`), m)
            if (global.db.setting.prefix.includes(text.charAt(0)) || text.charAt(0) == global.db.setting.onlyprefix) return client.reply(m.chat, Func.texted('bold', `🚩 File name cannot start with a prefix.`), m)
            let filesize = typeof q.fileLength == 'undefined' ? q.msg.fileLength.low : q.fileLength.low
            let chSize = Func.sizeLimit(await Func.getSize(filesize), 7)
            if (chSize.oversize) return client.reply(m.chat, Func.texted('bold', `🚩 File size cannot be more than 7 MB.`), m)
            let database = []
            const cursor = gridFs.action.find({})
            for await (const doc of cursor) {
               database.push(doc)
            }
            let check = database.some(v => v.metadata.name == text)
            if (check) return client.reply(m.chat, Func.texted('bold', `🚩 File already exists in the database.`), m)
            client.sendReact(m.chat, '🕒', m.key)
            let extension = /audio/.test(q.mimetype) ? 'mp3' : /video/.test(q.mimetype) ? 'mp4' : mime.extension(q.mimetype)
            let filename = Func.uuid() + '.' + extension
            if (extension == 'mp3') {
               let media = await client.saveMediaMessage(m.quoted)
               exec(`ffmpeg -i ${media} ${filename}`, async (err, stderr, stdout) => {
                  fs.unlinkSync(media)
                  if (err) return client.reply(m.chat, Func.texted('bold', `❌ Failed to convert.`), m)
                  const buffer = fs.readFileSync(filename)
                  const upload = streamifier.createReadStream(buffer).pipe(gridFs.action.openUploadStream(filename, {
                     metadata: {
                        name: text.toLowerCase().trim(),
                        filename,
                        mime: q.mimetype,
                        ptt: /audio/.test(q.mimetype) ? q.ptt ? true : false : false,
                        bytes: filesize,
                        size: await Func.getSize(filesize),
                        author: m.sender,
                        uploaded_at: new Date * 1,
                     }
                  }))
                  if (!upload) return client.reply(m.chat, Func.texted('bold', `❌ ${p.msg}`), m)
                  return client.reply(m.chat, `🚩 File successfully saved with name : *${text} (${await Func.getSize(filesize)})*, to get files use *${isPrefix}getfile*`, m).then(() => fs.unlinkSync(filename))
               })
            } else {
               fs.writeFileSync(path.join(tmp, filename), file)
               const buffer = fs.readFileSync(path.join(tmp, filename))
               const upload = streamifier.createReadStream(buffer).pipe(gridFs.action.openUploadStream(filename, {
                  metadata: {
                     name: text.toLowerCase().trim(),
                     filename,
                     mime: q.mimetype,
                     ptt: /audio/.test(q.mimetype) ? q.ptt ? true : false : false,
                     bytes: filesize,
                     size: await Func.getSize(filesize),
                     author: m.sender,
                     uploaded_at: new Date * 1,
                  }
               }))
               if (!upload) return client.reply(m.chat, Func.texted('bold', `❌ ${p.msg}`), m)
               return client.reply(m.chat, `🚩 File successfully saved with name : *${text} (${await Func.getSize(filesize)})*, to get files use *${isPrefix}getfile*`, m).then(() => fs.unlinkSync(path.join(tmp, filename)))
            }
         } else if (command === 'getfile') {
            if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'meow'), m)
            let database = []
            const cursor = gridFs.action.find({})
            for await (const doc of cursor) {
               database.push(doc)
            }
            const files = database.find(v => v.metadata.name == text)
            if (!files) return client.reply(m.chat, Func.texted('bold', `🚩 File named "${text}" does not exist in the database.`), m)
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
         } else if (command === 'delfile') {
            if (!isOwner) return m.reply(global.status.owner)
            if (!text) return client.reply(m.chat, Func.texted('bold', `🚩 Give name of the file to be delele.`), m)
            let database = []
            const cursor = gridFs.action.find({})
            for await (const doc of cursor) {
               database.push(doc)
            }
            const files = database.find(v => v.metadata.name === text.toLowerCase())
            if (!files) return m.reply(Func.texted('bold', `🚩 File not found.`))
            gridFs.action.delete(files._id)
            m.reply(Func.texted('bold', `🚩 File removed!`))
         } else if (command === 'files') {
            let database = []
            const cursor = gridFs.action.find({})
            for await (const doc of cursor) {
               database.push(doc)
            }
            if (database.length < 1) return client.reply(m.chat, Func.texted('bold', `🚩 No files saved.`), m)
            let text = `乂 *F I L E S*\n\n`
            text += database.map((v, i) => {
               if (i == 0) {
                  return `┌  ◦  ${v.metadata.name} (${v.metadata.size})`
               } else if (i == database.length - 1) {
                  return `└  ◦  ${v.metadata.name} (${v.metadata.size})`
               } else {
                  return `│  ◦  ${v.metadata.name} (${v.metadata.size})`
               }
            }).join('\n')
            m.reply(text + '\n\n' + global.footer)
         } else if (command === 'drop') {
            if (!isOwner) return m.reply(global.status.owner)
            gridFs.action.drop()
            m.reply(Func.texted('bold', `🚩 All files were successfully deleted!`))
         } else if (command === 'storage') {
            let database = []
            const cursor = gridFs.action.find({})
            for await (const doc of cursor) {
               database.push(doc)
            }
            if (database.length < 1) return client.reply(m.chat, Func.texted('bold', `🚩 No files saved.`), m)
            let size = 0
            database.map(v => size += v.metadata.bytes)
            let teks = `Use the following command to save media files to Cloud Storage :\n\n`
            teks += `➠ *${isPrefix}files* ~ See all files saved\n`
            teks += `➠ *${isPrefix}save filename* ~ Save files\n`
            teks += `➠ *${isPrefix}getfile filename* ~ Get files in the database\n`
            teks += `➠ *${isPrefix}delfile filename* ~ Delete files\n`
            teks += `➠ *${isPrefix}drop* ~ delete all files\n\n`
            teks += `💾 Total Size : [ *${Func.formatSize(size)}* ]`
            m.reply(teks)
         }
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}