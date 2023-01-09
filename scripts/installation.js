const Select = document.querySelector('.installation__select')
const Link = document.querySelector('.installation__link')
const Image = document.querySelector('.installation__qr')

const createConfig = ({ iface, peer }) => (
`[Interface]
Address = ${iface.address}
DNS = ${iface.dns}
PrivateKey = ${iface.key}

[Peer]
PublicKey = ${peer.pubkey}
PresharedKey = ${peer.psk}
AllowedIPs = ${peer.allowed_ips}
Endpoint = ${peer.endpoint}
PersistentKeepalive = 25`
)

const createURI = (text) => `data:text/plain;charset=utf-8,${encodeURIComponent(createConfig(text))}`

fetch('https://api.fuckrkn1.xyz/locations')
    .then((res) => res.json())
    .then((data) => {
        data.forEach((server) => {
            const Option = document.createElement('option')

            Option.setAttribute('value', server.code)
            Option.appendChild(document.createTextNode(server.name))

            Select.appendChild(Option)
        })
    })

fetch('https://api.fuckrkn1.xyz/peer')
    .then((res) => res.json())
    .then((data) => {
        Link.setAttribute('href', createURI(data))
        Link.setAttribute('download', 'fuckrkn1.conf')
    
        const qrcode = new QRCode({
            content: createConfig(data),
            padding: 0,
            width: 256,
            height: 256,
            color: "#000000",
            background: "transparent",
            ecl: "M",
        })
        
        Image.setAttribute('src', `data:image/svg+xml;utf8,${encodeURIComponent(qrcode.svg())}`)
    })

Select.addEventListener('change', () => {
    Link.removeAttribute('href')
    Link.removeAttribute('download')
    Image.setAttribute('src', '/Images/qr-placeholder.svg')

    const url = Select.value.length
        ? `https://api.fuckrkn1.xyz/peer?location=${Select.value}`
        : 'https://api.fuckrkn1.xyz/peer'

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            Link.setAttribute('href', createURI(data))
            Link.setAttribute('download', 'fuckrkn1.conf')
        
            const qrcode = new QRCode({
                content: createConfig(data),
                padding: 0,
                width: 256,
                height: 256,
                color: "#000000",
                background: "transparent",
                ecl: "M",
            })
            
            Image.setAttribute('src', `data:image/svg+xml;utf8,${encodeURIComponent(qrcode.svg())}`)
        })
})