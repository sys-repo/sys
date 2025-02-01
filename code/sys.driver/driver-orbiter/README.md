# state.fs.ipfs.orbiter

## Orbiter Driver (IPFS)
Binary state in the cloud over an HTTP bridge from [IPFS](https://ipfs.tech) using [IPCM](https://ipcm.dev) 
for pinned [CID](https://docs.ipfs.tech/concepts/content-addressing/) mapping and auditably 
immutable version/history of `Uint8Array` data.

- https://orbiter.host
- https://ipcm.dev

This module contains tools for managing state deployed to IPFS on the 
[orbiter.host](https://orbiter.host) service.

## Layers

 ↑  FS (file-system) ← `Uint8Array`
 ↑  I/O: CLI (command-line)  
 ↑  Orbiter (DNS, serve, manage edge server config)  
 ↑  IPCM (CID mapping)  
✨  IPFS  

---

## IPCM
File-mapping on IPFS handled via [IPCM](https://ipcm.dev), where a blockchain is used to map 
file-paths to [CID](https://docs.ipfs.tech/concepts/content-addressing/)'s.


![ipcm-dev-state-binary-oss-mit-InterPlanetary-CID-Mapping](https://github.com/user-attachments/assets/3367b1f0-bcf8-47d1-a19c-d310bac40aa3)



```
With this ["IPCM mapping"] approach the contract address acts as the 
static address, and the state it holds can be dynamic.  

This results in several benefits:

- Cryptographically secures ownership and updates to an onchain identity
- Events create an onchain history of updates
- Can be deployed to any EVM chain
- Fetching the latest state is simple and fast

```
↑ source [ref: ipcm.dev](https://ipcm.dev)


---

### Notes / Reference:

- [API Reference](https://docs.orbiter.host/api-reference)
- ["IPCM vs IPNS"](https://www.pinata.cloud/blog/ipcm-vs-ipns/?utm_source=farcaster&utm_medium=social&utm_campaign=ipcm) - [@stevedylandev.eth](https://warpcast.com/stevedylandev.eth)
