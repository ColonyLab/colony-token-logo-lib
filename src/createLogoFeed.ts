import fs from 'fs'
import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3"
import axios from 'axios'

const BUCKET_NAME = "colony-assets"
const BUCKET_REGION = "eu-central-1"
const TRADERJOE_TOKEN_LIST_URL = "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/mc.tokenlist.json"

interface LogoData {
    [index: string]: string;
}

async function main (): Promise<void> {
    const outputAvalanche: LogoData = JSON.parse(fs.readFileSync('data/avalancheLogo.json', 'utf8'))
    const outputFuji: LogoData = JSON.parse(fs.readFileSync('data/fujiLogo.json', 'utf8'))

    const s3Client = new S3Client({ region: BUCKET_REGION })
    const data = await s3Client.send(new ListObjectsCommand({ Bucket: BUCKET_NAME }))

    if(data.Contents !== undefined){
        for(const element of data.Contents){
            const elementData = element.Key?.split("/")
            if(elementData?.length != 2){
                continue
            }
            if(!['avalanche', 'fuji'].includes(elementData[0])){
                continue
            }

            const fileData = elementData[1].split(".")
            if(fileData?.length != 2){
                continue
            }
            if(!['png', 'jpg', 'svg'].includes(fileData[1].toLowerCase())){
                continue
            }
            if(fileData[0].length !== 42){
                continue
            }

            if(elementData[0] === 'avalanche'){
                outputAvalanche[fileData[0].toLocaleLowerCase()] = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${element.Key}`
            }
            else if(elementData[0] === 'fuji'){
                outputFuji[fileData[0].toLocaleLowerCase()] = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${element.Key}`
            }
        }
    }

    const tokenList = await axios({
        method: 'get',
        url: TRADERJOE_TOKEN_LIST_URL,
    })

    for(const token of tokenList.data.tokens){
        if(token.chainId === 43114){
            if(outputAvalanche[token.address.toLowerCase()] === undefined){
                outputAvalanche[token.address.toLowerCase()] = token.logoURI
            }
        }
        else if(token.chainId === 43113){
            if(outputFuji[token.address.toLowerCase()] === undefined){
                outputFuji[token.address.toLowerCase()] = token.logoURI
            }
        }
    }

    fs.writeFileSync('data/avalancheLogo.json', JSON.stringify(outputAvalanche, null, 2))
    fs.writeFileSync('data/fujiLogo.json', JSON.stringify(outputFuji, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
