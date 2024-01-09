exports.run = {
   usage: ['+response'],
   hidden: ['+res'],
   use: 'name | response',
   category: 'owner',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      setting,
      Func,
      Scraper
   }) => {
      try {
         setting.response = setting.response ? setting.response : []
         if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'name | response'), m)
         let [name, response] = text.split`|`
         if (!name || !response) return client.reply(m.chat, Func.example(isPrefix, command, 'name | response'), m)
         const exists = setting.response.some(v => v._id === name.toLowerCase())
         if (exists) return client.reply(m.chat, Func.texted('bold', `🚩 Response already exist.`), m)
         if (response.length >= 250) return client.reply(m.chat, Func.texted('bold', `🚩 Response text max. 250 chars.`), m)
         var mediaUrl = ''
         let q = m.quoted ? m.quoted : m
         let mime = (q.msg || q).mimetype || ''
         if (/video|image\/(jpe?g|png)/.test(mime)) {
            let buffer = await q.download()
            if (!buffer) return client.reply(m.chat, global.status.wrong, m)
            let upload = await Scraper.uploadToServer(buffer)
            var mediaUrl = upload.data.url
         }
         setting.response.push({
            _id: name.toLowerCase().trim(),
            mediaUrl: mediaUrl ? mediaUrl : false,
            response: response.trim(),
            created_at: new Date * 1
         })
         client.reply(m.chat, Func.texted('bold', `🚩 Response successfully added.`), m)
      } catch (e) {
         client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}