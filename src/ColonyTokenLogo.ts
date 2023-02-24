import axios from "axios"
import SubgraphQueries from "./helpers/SubgraphQueries"

export enum Networks {
    avalanche, fuji
}

export class ColonyTokenLogo {

    readonly avalancheLogoUrl = 'https://raw.githubusercontent.com/ColonyLab/colony-token-logo-lib/master/data/avalancheLogo.json'
    readonly fujiLogoUrl = 'https://raw.githubusercontent.com/ColonyLab/colony-token-logo-lib/master/data/fujiLogo.json'
    readonly ipfsUrl = 'https://ipfs.colonylab.io/ipfs'
    readonly noLogoUrl = 'https://colony-assets.s3.eu-central-1.amazonaws.com/nologo.png'
    readonly cacheLifetime = 1800000 // 30min

    private colonySubgraphUrl: string
    private network: Networks

    private staticLogoCache = new Map<string, string>()
    private ipfsLogoCache = new Map<string, string>()
    private cacheLastRefresh = 0

    constructor (_colonySubgraphUrl: string, _network: Networks) {
        this.colonySubgraphUrl = _colonySubgraphUrl
        this.network = _network
    }

    public async getLogo(tokenAddress: string): Promise<string> {
        await this.refreshCacheIfNeeded()

        tokenAddress = tokenAddress.toLocaleLowerCase()

        let logoUrl = this.staticLogoCache.get(tokenAddress)
        if(logoUrl !== undefined){
            return logoUrl
        }

        logoUrl = this.ipfsLogoCache.get(tokenAddress)
        if(logoUrl !== undefined){
            return logoUrl
        }

        return this.noLogoUrl
    }

    private async refreshCacheIfNeeded(): Promise<void> {
        if(this.cacheLastRefresh + this.cacheLifetime < Date.now()){
            await this.loadCeTokensLogoList()
            await this.loadStaticLogoList()
            this.cacheLastRefresh = Date.now()
        }
    }

    private async loadCeTokensLogoList(): Promise<void> {
        const response = await SubgraphQueries.requestGraph(this.colonySubgraphUrl, `{
            projects(where: {ceToken_not: null}) {
              ceToken {
                id
              }
              logo
            }
          }`)

        const results = await response.data.data.projects

        this.ipfsLogoCache.clear()
        for(const element of results){
            this.ipfsLogoCache.set(element.ceToken.id.toLowerCase(), `${this.ipfsUrl}/${element.logo}`)
        }
    }

    private async loadStaticLogoList(): Promise<void> {
        const response = await axios({
            method: 'get',
            url: this.network === Networks.avalanche ? this.avalancheLogoUrl : this.fujiLogoUrl
        })

        this.staticLogoCache.clear()
        for(const address in response.data){
            this.staticLogoCache.set(address.toLowerCase(), response.data[address])
        }
    }
}

export default ColonyTokenLogo