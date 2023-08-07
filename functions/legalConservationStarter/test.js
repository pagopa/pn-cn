const { historyRepository, requestRepository } = require('pn-cn-commons')

async function test(){
    const a = 'a'
    const b = 'b'
    const c = {}
    const d = new Date()
    await historyRepository.putHistory(a, b, c, d)
}

test()