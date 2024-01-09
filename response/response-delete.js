exports.run = {
   usage: ['-response'],
   hidden: ['-res'],
   use: 'name',
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
         if (!text) return client.reply(m.chat, Func.example(isPrefix, command, 'XXXX'), m)
         const exists = setting.response.find(v => v._id === text.toLowerCase())
         if (!exists) return client.reply(m.chat, Func.texted('bold', `🚩 Response does not exists.`), m)
         Func.removeItem(setting.response, exists)
         client.reply(m.chat, Func.texted('bold', `🚩 Response successfully removed.`), m)
      } catch (e) {
         client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}