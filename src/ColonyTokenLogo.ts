import SubgraphQueries from "./helpers/SubgraphQueries"
import axios from 'axios'

export enum Networks {
    avalanche, fuji
}

export class ColonyTokenLogo {

    readonly s3Url = 'https://colony-assets.s3.eu-central-1.amazonaws.com/'
    readonly ipfsUrl = 'https://ipfs.colonylab.io/ipfs/'

    private colonySubgraphUrl: string
    private network: Networks

    private logoUrlCache = new Map<string, string>()

    constructor (_colonySubgraphUrl: string, _network: Networks) {
        this.colonySubgraphUrl = _colonySubgraphUrl
        this.network = _network
    }

    public async getLogo(tokenAddress: string): Promise<string> {
        tokenAddress = tokenAddress.toLocaleLowerCase()
        let logoUrl = this.logoUrlCache.get(tokenAddress)

        if(logoUrl === undefined){
            logoUrl = await this.findLogoUrl(tokenAddress)
            this.logoUrlCache.set(tokenAddress, logoUrl)
        }

        return logoUrl
    }

    private async findLogoUrl(tokenAddress: string): Promise<string> {
        const ceTokenIpfsId = await this.getCeTokenLogoIpfsId(tokenAddress)
        if(ceTokenIpfsId !== null) {
           return this.ipfsUrl + ceTokenIpfsId
        }

        const s3LogoFileExists = await this.checkS3LogoFileExists(tokenAddress)
        if(s3LogoFileExists === true) {
            return this.s3Url + Networks[this.network] + '/' + tokenAddress + '.png'
        }

        return this.s3Url + 'nologo.png'
    }

    private async getCeTokenLogoIpfsId(tokenAddress: string): Promise<string | null> {
        const response = await SubgraphQueries.requestGraph(this.colonySubgraphUrl, `{
            erc20Tokens(where:{id: "${tokenAddress}"}){
              earlyStageCeToken{
                logo
              }
            }
          }`)

        const results = await response.data.data.erc20Tokens
        if(results.length > 0){
            if(results[0].earlyStageCeToken.length > 0){
                return results[0].earlyStageCeToken[0].logo
            }
            else{
                return null
            }
        }
        else{
            return null
        }
    }

    private async checkS3LogoFileExists(tokenAddress: string): Promise<boolean> {
        try{
            const response = await axios({
                method: 'get',
                url: this.s3Url + Networks[this.network] + '/' + tokenAddress + '.png'
            })
            return response.status === 200
        }
        catch(e){
            return false
        }
    }
}

export default ColonyTokenLogo