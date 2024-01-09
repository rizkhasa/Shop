exports.run = {
   usage: ['+product'],
   use: 'name | content',
   category: 'store',
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
         setting.product = setting.product ? setting.product : []
         if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'premium script | price 150k'), m)
         let [name, ...content] = text.split `|`
         content = (content || []).join `|`
         if (!name) return client.reply(m.chat, Func.example(isPrefix, command, 'premium script | price 150k'), m)
         const exists = setting.product.some(v => v.name === name.toLowerCase())
         if (exists) return client.reply(m.chat, Func.texted('bold', `🚩 Product already exist.`), m)
         var mediaUrl = ''
         let q = m.quoted ? m.quoted : m
         let mime = (q.msg || q).mimetype || ''
         if (/image\/(jpe?g|png)/.test(mime)) {
            let buffer = await q.download()
            if (!buffer) return client.reply(m.chat, global.status.wrong, m)
            let upload = await Scraper.uploadImage(buffer)
            var mediaUrl = upload.data.url
         }
         setting.product.push({
            name: name.trim(),
            mediaUrl: mediaUrl ? mediaUrl : false,
            content: (m.quoted && m.quoted.text) ? m.quoted.text.trim() : content.trim(),
            created_at: new Date * 1
         })
         client.reply(m.chat, Func.texted('bold', `🚩 Product successfully added.`), m)
      } catch (e) {
         client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}