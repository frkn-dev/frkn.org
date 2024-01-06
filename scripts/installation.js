const Select = document.querySelector('.installation__select')
const Link = document.querySelector('.installation__link')
const ImageWrapper = document.querySelector('.installation__qr-wrapper')
const Image = document.querySelector('.installation__qr')
const Error = document.querySelector('.installation__error')

/* Creating configs */

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

/* Elements state */

const setLoadingSelect = (isLoading) => {
    if (isLoading) {
        Select.setAttribute('disabled', true)
        Select.classList.add('loading')
    } else {
        Select.removeAttribute('disabled')
        Select.classList.remove('loading')
    }
}

const setDisabledLink = (isDisabled) => {
    if (isDisabled) {
        Link.classList.add('disabled')
        Link.innerHTML = Link.dataset.disabledText
    } else {
        Link.classList.remove('disabled')
        Link.innerHTML = Link.dataset.text
    }
}

const setLoadingLink = (isLoading, data) => {
    if (isLoading) {
        Link.removeAttribute('href')
        Link.removeAttribute('download')
    } else {
        Link.setAttribute('href', createURI(data))
        Link.setAttribute('download', 'frkn.conf')
    }
}

const setHidingImage = (isHiding, data) => {
    if (isHiding) {
        ImageWrapper.classList.add('disabled')
        Image.removeAttribute('src')
    } else {
        const qrcode = new QRCode({
            content: createConfig(data),
            padding: 0,
            width: 256,
            height: 256,
            color: "#000000",
            background: "transparent",
            ecl: "M",
        })
        
        ImageWrapper.classList.remove('disabled')
        Image.setAttribute('src', `data:image/svg+xml;utf8,${encodeURIComponent(qrcode.svg())}`)
    }
}

const setError = (isError) => {
    if (isError) {
        Error.classList.remove('hidden')
    } else {
        Error.classList.add('hidden')
    }
}

/* Fetch callbacks */

const setOptions = (data) => {
    data.forEach((server) => {
        const Option = document.createElement('option')

        Option.setAttribute('value', server.code)
        Option.appendChild(document.createTextNode(server.name))

        Select.appendChild(Option)
    })
}

const setConfigs = (data) => {
    setLoadingLink(false, data)
    setHidingImage(false, data)
}

/* Main */

fetch('https://api.frkn.org/locations')
    .then((res) => res.json())
    .then((data) => setOptions(data))
    .catch(() => {
        setError(true)
    })
    .finally(() => {
        setLoadingSelect(false)
    })

Select.addEventListener('change', () => {
    setLoadingLink(true)
    setHidingImage(true)
    setError(false)

    if (Select.value === '') {
        setDisabledLink(true)
        return
    }

    setDisabledLink(false)
    setLoadingSelect(true)

    fetch(`https://api.frkn.org/peer?location=${Select.value}`)
        .then((res) => res.json())
        .then((data) => setConfigs(data))
        .catch(() => {
            setDisabledLink(true)
            setError(true)
        })
        .finally(() => {
            setLoadingSelect(false)
        })
})
