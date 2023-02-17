import axios, { AxiosResponse } from 'axios'

export default class GraphProvider {

    public static async requestGraph(subgraphUrl: string, query: string): Promise<AxiosResponse> {
        return await axios({
            method: 'post',
            url: subgraphUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            data: JSON.stringify({
                query
            })
        })
    }

}
