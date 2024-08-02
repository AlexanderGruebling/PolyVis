export function extractDataFromQuery(queryResult) {
    let result = [];
    for(let batch of queryResult.batches) {
        for(let child of batch.data.children) {
            result.push(...child.values);
        }
    }
    return result
}