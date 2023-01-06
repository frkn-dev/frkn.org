const Select = document.querySelector('.installation__select')
const Link = document.querySelector('.installation__link')
const Image = document.querySelector('.installation__qr')

const createConfig = ({ interface, peer }) => (
`[Interface]
Address = ${interface.address}
DNS = ${interface.dns}
PrivateKey = ${interface.key}

[Peer]
PublicKey = ${peer.pubkey}
PresharedKey = ${peer.psk}
AllowedIPs = ${peer.allowed_ips}
Endpoint = ${peer.endpoint}
PersistentKeepalive = 25`
)

const createURI = (text) => `data:text/plain;charset=utf-8,${encodeURIComponent(createConfig(text))}`

fetch('http://94.176.238.220:8080/locations')
    .then((res) => res.json())
    .then((data) => {
        data.forEach((server) => {
            const Option = document.createElement('option')

            Option.setAttribute('value', server.code)
            Option.appendChild(document.createTextNode(server.name))

            Select.appendChild(Option)
        })
    })

fetch('http://94.176.238.220:8080/peer')
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
    console.log(Select.value)
})