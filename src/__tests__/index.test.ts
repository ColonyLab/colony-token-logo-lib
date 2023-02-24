import ColonyTokenLogo, { Networks } from '../ColonyTokenLogo'
describe('Test 1', () => {

  test('sample test', async () => {
    const lib = new ColonyTokenLogo('https://graph.colonylab.io/subgraphs/name/colony/fuji-develop', Networks.fuji)
    expect(await lib.getLogo('0x8fa2af96d94646fa0bd30c67c30d50807d34c25b')).toEqual('https://colony-assets.s3.eu-central-1.amazonaws.com/nologo.png')
  })

})
