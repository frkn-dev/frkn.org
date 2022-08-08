export const content: { [key: string]: any } = {
    header: {
        ru: `Инструкции по установке`,
        en: `Installation`,
    },
    platforms: {
        ru: "Поддерживаемые платформы",
        en: "Support platforms",
    },
    options: [
        {
            id: "windows",
            img: "/logos/windows-brands.svg",
            title: "Windows",
        },
        {
            id: "macos",
            img: "/logos/apple-brands.svg",
            title: "macOS",
        },
        {
            id: "ios",
            img: "/logos/apple-brands.svg",
            title: "iOS",
        },
        {
            id: "android",
            img: "/logos/android-brands.svg",
            title: "Android",
        },
        {
            id: "linux",
            img: "/logos/linux-brands.svg",
            title: "Linux",
        },
        {
            id: "oculus",
            img: "/logos/vr-cardboard-solid.svg",
            title: "Oculus Quest",
        },
    ],
    configSection: {
        subtitle: {
            ru: "Файлы конфигурации",
            en: "Config files",
        },
    },
    instSection: {
        subtitle: {
            ru: "Инструкция",
            en: "Instructions",
        },
    },
    screencastSection: {
        subtitle: {
            ru: "Скринкаст",
            en: "Screencast",
        },
        text: {
            ru: "Ваш браузер не поддерживает встроенные видео. Попробуйте скачать его по",
            en: "Your browser does not support HTML5 videos. Try downloading the video from",
        },
        textLink: {
            ru: "этой ссылке",
            en: "this link",
        },
    },
    instructions: {
        windows: {
            title: "Windows",
            configFiles: [
                {
                    ikev2_config_import:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/ikev2_config_import.cmd",
                },
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.p12",
                },
            ],
            steps: [
                {
                    ru: `Сохраните файл <b>vpnclient.p12</b> на ваше устройство.`,
                    en: `Download <b>vpnclient.p12</b> file to your device.`,
                },
                {
                    ru: `Сохраните файл <b>ikev2_config_import.cmd</b> в ту же папку, что и файл <b>vpnclient.p12.</b>`,
                    en: `Download <b>ikev2_config_import.cmd</b> file and put it in the same folder as <b>vpnclient.p12</b> file.`,
                },
                {
                    ru: `Нажмите правой кнопкой мыши на файл <b>ikev2_config_import.cmd</b>, выберите <b>Свойства</b>. Поставьте галочку <b>Разблокировать</b> и нажмите <b>ОК</b>.`,
                    en: `Right-click on the file <b>ikev2_config_import.cmd</b>, select <b>Properties</b>. Click on <b>Unblock</b> at the bottom, then click on <b>OK</b>.`,
                },
                {
                    ru: `Нажмите правой кнопкой мыши на файл <b>ikev2_config_import.cmd</b>, выберите <b>Запустить от имени администратора</b>. После этого откроется окно терминала.`,
                    en: `Right-click on the file <b>ikev2_config_import.cmd</b>, select <b>Run as administrator</b>. After these steps, a terminal window will open.`,
                },
                {
                    ru: `Введите имя VPN клиента (или нажмите <b>Enter</b>, скрипт самостоятельно выберет имя файла).`,
                    en: `Choose the VPN client name (or just press <b>Enter</b>, it will choose the file's name).`,
                },
                {
                    ru: `Введите доменное имя сервера - <b>lt.fuckrkn1.xyz</b>.`,
                    en: `Enter domain name of the server - <b>lt.fuckrkn1.xyz</b>.`,
                },
                {
                    ru: `Введите имя для VPN подключения (или нажмите <b>Enter</b>, установится стандартное имя).`,
                    en: `Choose the VPN connection name (or just press <b>Enter</b>, script will choose default name).`,
                },
                {
                    ru: `Нажмите любую кнопку для завершения скрипта. Для подключения к VPN: Нажмите на иконку <b>Сеть</b> в трее вашей системы правой кнопкой мыши, откройте <b>Параметры сети и Интернет</b>, зайдите в VPN и подключайтесь к новому профилю.`,
                    en: `Press any key to finish script. To connect to the VPN: Right-click on the <b>wireless/network</b> icon in your system tray, open settings, go to the <b>VPN</b>, select the new entry, and click <b>Connect</b>.`,
                },
            ],
            video: {
                url: "https://s.fuckrkn1.xyz/video/windows-guide.mov",
                preload: "metadata",
                poster: "/media/video/posters/windows-poster.png",
                controls: "1",
                type: "video/mp4; codecs=avc1.4D401E,mp4a.40.2",
                width: "600",
                height:"400"
            },
        },
        macos: {
            title: "macOS",
            configFiles: [
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.mobileconfig",
                },
            ],
            steps: [
                {
                    ru: `Сохраните файл <b>vpnclient.mobileconfig</b> на ваше устройство.`,
                    en: `Download the <b>vpnclient.mobileconfig</b> file to your device.`,
                },
                {
                    ru: `Откройте его двойным щелчком, появится уведомление.`,
                    en: `Double-click it, you'll get a OS notification.`,
                },
                {
                    ru: `Откройте <b>&#63743; → System Preferences → Profiles</b> и установите профиль.`,
                    en: `Open <b>&#63743; → System Preferences → Profiles</b> and install the profile.`,
                },
                {
                    ru: `Откройте <b>&#63743; → System Preferences → Network</b> и подключайтесь.`,
                    en: `Open <b>&#63743; → System Preferences → Network</b> and connect.`,
                },
            ],
            video: {
                url: "./media/video/screencasts/macos-screencast.av1.mp4",
                preload: "metadata",
                poster: "/media/video/posters/macos-poster.png",
                controls: "1",
                type: "video/mp4; codecs=av01.0.05M.08,opus",
                width: "600",
                height:"400"
            },
        },
        ios: {
            title: "iOS (iPhone/iPad)",
            configFiles: [
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.mobileconfig",
                },
            ],
            steps: [
                {
                    ru: `Сохраните файл <b>vpnclient.mobileconfig</b> на ваше устройство.`,
                    en: `Download the <b>vpnclient.mobileconfig</b> file to your device.`,
                },
                {
                    ru: `Переместите файл в папку <b>iPhone.</b>`,
                    en: `Move the file to the <b>On my iPhone</b> folder`,
                },
                {
                    ru: `Зайдите в <b>Настройки</b> и <b>установите</b> профиль.`,
                    en: `Open <b>Settings</b> and <b>install</b> the profile.`,
                },
                {
                    ru: `Зайдите в <b>Настройки</b> > <b>VPN</b> и подключайтесь.`,
                    en: `Go to <b>Settings</b> > <b>VPN</b> and connect.`,
                },
            ],
            video: {
                url: "./media/video/screencasts/ios-screencast.h264.mp4",
                preload: "metadata",
                poster: "/media/video/posters/ios-poster.png",
                controls: "1",
                type: "video/mp4; codecs=avc1.4D401E,mp4a.40.2",
                width: "600",
                height:"400"
            },
        },
        android: {
            title: "Android",
            configFiles: [
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.sswan",
                },
            ],
            steps: [
                {
                    ru: `Загрузите <a href="https://play.google.com/store/apps/details?id=org.strongswan.android" target="_blank" rel="noopener noreferrer">strongSwan VPN Client</a> из Google Play`,
                    en: `Download <a href="https://play.google.com/store/apps/details?id=org.strongswan.android" target="_blank" rel="noopener noreferrer">strongSwan VPN Client</a> from Google Play`,
                },
                {
                    ru: `Сохраните файл <b>vpnclient.sswan</b> на ваше устройство.`,
                    en: `Download <b>vpnclient.sswan</b> file to your device.`,
                },
                {
                    ru: `Нажмите на кнопку в верхнем-правом углу > <b>Import VPN profile</b> > <b>Выберите файл</b>.`,
                    en: `Press the button in the top right corner > <b>Import VPN profile</b> > <b>Choose the file</b>.`,
                },
                {
                    ru: "Выберите сертификат VPN.",
                    en: "Choose the <b>VPN certificate</b>.",
                },
                {
                    ru: "Подключайтесь к VPN.",
                    en: `Connect to the <b>VPN</b>.`,
                },
            ],
            video: {
                url: "https://s.fuckrkn1.xyz/video/android-guide.mp4",
                preload: "metadata",
                poster: "/media/video/posters/android-poster.png",
                controls: "1",
                type: "video/mp4; codecs=avc1.4D401E,mp4a.40.2",
                width: "400",
                height:"600"
            },
        },
        oculus: {
            title: "Oculus Quest",
            configFiles: [
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.sswan",
                },
            ],
            steps: [
                {
                    ru: `Необходимо активировать <b>developer mode</b> на <b>Oculus Quest 2</b>, что бы можно было
                  устанавливать приложения самостоятельно, гайд по активации с
                  <a href="https://developer.oculus.com/documentation/native/android/mobile-device-setup/"
                  target="_blank" rel="noopener noreferrer">официального сайта</a>.
                  Теперь когда мы можем устанавливать сторонние приложения (так
                  называемый sideloading) нам необходимо перенести на шлем файл
                  <a href="https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.sswan" download="vpnclient.sswan">vpnclient.sswan</a> (по
                  аналогии с установкой на android). Это можно сделать через встроенный в шлем браузер либо используя
                  <b>adb</b>, скачиваем файл на пк и пушим его на шлем:
                    <code class="code-scroll-box">adb push vpnclient.sswan /sdcard/</code>`,
                    en: `In order to install applications, you need to activate <b>developer mode</b> on <b>Oculus
                  Quest 2</b> (see activation guide <a href="https://developer.oculus.com/documentation/native/android/mobile-device-setup/"
                  target="_blank" rel="noopener noreferrer">here</a>).
                  After this step you can install third-party applications (i.e. sideloading). Then you need to
                  transfer <a href="https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.sswan" download="vpnclient.sswan">vpnclient.sswan</a>
                  to your device (the process of installation is the same as on Android).
                  This can be done via internal browser or by using <b>adb</b>. Download the file to your PC, then
                  push it to the device:
                    <code class="code-scroll-box">adb push vpnclient.sswan /sdcard/</code>`,
                },
                {
                    ru: `Следующим шагом установим <b>strong swan</b> скачав apk по
                  <a href="https://download.strongswan.org/Android/" target="_blank"
                  rel="noopener noreferrer">ссылке</a> и установив его на шлем командой:
                    <code class="code-scroll-box">adb install -g -r strongSwan-2.3.3.apk</code>`,
                    en: `The next step is <b>strong swan</b> installation. Download apk from <a
                  href="https://download.strongswan.org/Android/" target="_blank"
                  rel="noopener noreferrer">here</a> and install it with the next
                  command: 
                    <code class="code-scroll-box">adb install -g -r strongSwan-2.3.3.apk</code>`,
                },
                {
                    ru: `И вот теперь казалось бы можно надеть шлем и повторить шаги с
                  андройда но есть одна хитрость. По умолчанию встроенный файловый
                  менеджер достаточно урезан и при нажатии на <b>import vpn profile</b>
                  просто ничего не произойдет (по аналогичной причине strong swan
                  устанавливается через adb) поэтому переходим к следующему шагу`,
                    en: `Unfortunately, the built-in file manager is quite truncated, so when you click on <b>import vpn
                  profile</b> nothing will happen (that’s why strong swan is installed via adb). Therefore, a
                  couple of additional steps need to be taken.`,
                },
                {
                    ru: `Скачиваем и устанавливаем кастомный file manager, например Mixplorer
                  (у меня установлен он) с <a href="https://4pda.to/forum/index.php?showtopic=318294" target="_blank"
                  rel="noopener noreferrer">4pda</a> и устанавливаем его командой
                  <code class="code-scroll-box">adb install -g -r mixplorer.apk</code>`,
                    en: `Download any decent file manager (I personally use <a
                  href="https://4pda.to/forum/index.php?showtopic=318294" target="_blank"
                  rel="noopener noreferrer">Mixplorer</a>) and install it with
                  the command: <code class="code-scroll-box">adb install -g -r mixplorer.apk</code>`,
                },
                {
                    ru: `Теперь можно надеть шлем и оставшиеся шаги повторить как при
                  установке на <a href="#android">android</a>. Теперь по нажатию на <b>import VPN profile</b>
                  для навигации и выбора файла будет использоваться mixplorer.`,
                    en: `Put on your VR headset and repeat the remaining steps as when installing on 
                  <a href="#android">android</a>. Now when you click on <b>import VPN profile</b> Mixplorer will be used to navigate and select a file.`,
                },
            ],
        },
        linux: {
            title: "Linux",
            configFiles: [
                {
                    vpnclient:
                        "https://s.fuckrkn1.xyz/client-conf/0.0.2/vpnclient.p12",
                },
            ],
            steps: [
                {
                    ru: `Чтобы настроить подключение через IKEv2 VPN клиент на вашем Linux
              компьютере, сначала установите strongSwan плагин для NetworkManager:
              <code class="code-scroll-box">
    # Ubuntu и Debian
    sudo apt-get update
    sudo apt-get install network-manager-strongswan

    # Gentoo Linux
    sudo emerge --sync
    sudo emerge net-vpn/networkmanager-strongswan

    # Arch Linux
    sudo pacman -Syu  # upgrade all packages
    sudo pacman -S networkmanager-strongswan

    # Fedora
    sudo yum install NetworkManager-strongswan-gnome

    # CentOS
    sudo yum install epel-release
    sudo yum --enablerepo=epel install NetworkManager-strongswan-gnome
              </code>`,
                    en: `To configure your Linux computer to connect to IKEv2 as a VPN client, first install the strongSwan
              plugin for NetworkManager:
              <code class="code-scroll-box">
    # Ubuntu и Debian
    sudo apt-get update
    sudo apt-get install network-manager-strongswan

    # Gentoo Linux
    sudo emerge --sync
    sudo emerge net-vpn/networkmanager-strongswan

    # Arch Linux
    sudo pacman -Syu  # upgrade all packages
    sudo pacman -S networkmanager-strongswan

    # Fedora
    sudo yum install NetworkManager-strongswan-gnome

    # CentOS
    sudo yum install epel-release
    sudo yum --enablerepo=epel install NetworkManager-strongswan-gnome
              </code>`,
                },
                {
                    ru: `Далее сохраните <b>.p12</b> файл из репозитория на ваш Linux
              компьютер. После этого, извлеките CA сертификат, сертификат клиента
              и приватный ключ. Замените <b>vpnclient.p12</b> в примере ниже на
              имя вашего <b>.p12</b> файла (если вы его не переименовывали, то имя
              заменять не придется).
              <code class="code-scroll-box">
    # Пример: Извлеките CA сертификат, сертификат клиента и приватный ключ.
    # Вы можете удалить .p12 файл после этого
    # Примечание: У вас может запросить Import password, просто жмите Enter.
    openssl pkcs12 -in vpnclient.p12 -cacerts -nokeys -out ikev2vpnca.cer
    openssl pkcs12 -in vpnclient.p12 -clcerts -nokeys -out vpnclient.cer
    openssl pkcs12 -in vpnclient.p12 -nocerts -nodes  -out vpnclient.key
    rm vpnclient.p12

    # (ВАЖНО) Защитите сертификат и приватный ключ!
    # Этот шаг не обязательный, но строго рекомендован к выполнению!
    sudo chown root.root ikev2vpnca.cer vpnclient.cer vpnclient.key
    sudo chmod 600 ikev2vpnca.cer vpnclient.cer vpnclient.key
              </code>`,
                    en: `Next, securely transfer the generated <b>.p12</b> file from the repository to your Linux computer.
              After that, extract the CA certificate, client certificate and private key. Replace <b>vpnclient.p12</b>
              in the example below with the name of your <b>.p12</b> file.
              <code class="code-scroll-box">
    # Example: Extract CA certificate, client certificate and private key.
    # You may delete the .p12 file when finished.
    #  Note: You may need to enter the import password, which can be found
    #  in the output of the IKEv2 helper script. If the output does not
    #  contain an import password, press Enter to continue.
    openssl pkcs12 -in vpnclient.p12 -cacerts -nokeys -out ikev2vpnca.cer
    openssl pkcs12 -in vpnclient.p12 -clcerts -nokeys -out vpnclient.cer
    openssl pkcs12 -in vpnclient.p12 -nocerts -nodes  -out vpnclient.key
    rm vpnclient.p12

    # (Important) Protect certificate and private key files
    # Note: This step is optional, but strongly recommended.
    sudo chown root.root ikev2vpnca.cer vpnclient.cer vpnclient.key
    sudo chmod 600 ikev2vpnca.cer vpnclient.cer vpnclient.key
              </code>`,
                },
                {
                    ru: `Перейдите <b>Настройки -> Сеть -> VPN</b>. Нажмите на кнопку <b>+</b>.`,
                    en: `Go to <b>Settings -> Network -> VPN</b>. Click the <b>+</b> button.`,
                },
                {
                    ru: "Вписывайте что-угодно в поле Название.",
                    en: "Enter anything you like in the Name field.",
                },
                {
                    ru: `В секции <b>Gateway (Server)</b>, введите адрес сервера в поле <b>Address</b>.
                Можете найти адрес <a href="https://github.com/nezavisimost/FuckRKN1/tree/main/client-conf"
                target="_blank" rel="noopener noreferrer">тут</a>.`,
                    en: `In the <b>Gateway (Server)</b> section, enter Your <code>VPN Server IP</code> (or DNS name) for
                the <b>Address</b>. / you can find it <a href="https://github.com/nezavisimost/FuckRKN1/tree/main/client-conf" 
                target="_blank" rel="noopener noreferrer">here</a>.`,
                },
                {
                    ru: `Выберите <code>ikev2vpnca.cer</code> файл для <b>Certificate</b>.`,
                    en: `Select the <code>ikev2vpnca.cer</code> file for the <b>Certificate</b>.`,
                },
                {
                    ru: `В секции <b>Client</b>, выберите <b>Certificate(/private key)</b> в поле <b>Authentication</b>.`,
                    en: `In the <b>Client</b> section, select <b>Certificate(/private key)</b> in the <b>Authentication</b> drop-down menu.`,
                },
                {
                    ru: `Выберите <b>Certificate/private key</b> в поле <b>Certificate</b> (ЕСЛИ У ВАС ОНО ЕСТЬ).`,
                    en: `Select <b>Certificate/private key</b> in the <b>Certificate</b> drop-down menu (if exists).`,
                },
                {
                    ru: `Выберите <code>vpnclient.cer</code> файл в поле <b>Certificate (file)</b>.`,
                    en: `Select the <code>vpnclient.cer</code> file for the <b>Certificate (file)</b>.`,
                },
                {
                    ru: `Выберите <code>vpnclient.key</code> файл в поле <b>Private key</b>.`,
                    en: `Select the <code>vpnclient.key</code> file for the <b>Private key</b>.`,
                },
                {
                    ru: `В секции <b>Options</b>, поставьте галочку <b>Request an inner IP address</b>.`,
                    en: `In the <b>Options</b> section, check the <b>Request an inner IP address</b> checkbox.`,
                },
                {
                    ru: `В секции <b>Cipher proposals (Algorithms)</b>, поставьте галочку <b>Enable custom proposals</b>.`,
                    en: `In the <b>Cipher proposals (Algorithms)</b> section, check the <b>Enable custom proposals</b> checkbox.`,
                },
                {
                    ru: `Оставьте поле <b>IKE пустым</b>.`,
                    en: `Leave the <b>IKE</b> field blank .`,
                },
                {
                    ru: `Введите <code>aes128gcm16</code> в поле <b>ESP</b>.`,
                    en: `Enter <code>aes128gcm16</code> in the <b>ESP</b> field.`,
                },
                {
                    ru: `Нажмите <b>Добавить</b> чтобы сохранить информацию о VPN подключении.`,
                    en: `Click <b>Add</b> to save the VPN connection information.`,
                },
                {
                    ru: "Включите VPN.",
                    en: `Turn the <b>VPN</b> switch ON..`,
                },
            ],
        },
    },
};
