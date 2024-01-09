exports.run = {
   usage: ['-product'],
   use: 'id',
   category: 'store',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      setting,
      Func
   }) => {
      try {
         setting.product = setting.product ? setting.product : []
         if (!args || !args[0]) return client.reply(m.chat, Func.example(isPrefix, command, '1'), m)
         const exists = setting.product.sort((a, b) => a.created_at - b.created_at)[Number(args[0]) - 1]
         if (!exists) return client.reply(m.chat, Func.texted('bold', `🚩 Product does not exists.`), m)
         Func.removeItem(setting.product, exists)
         client.reply(m.chat, Func.texted('bold', `🚩 Product successfully removed.`), m)
      } catch (e) {
         client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}