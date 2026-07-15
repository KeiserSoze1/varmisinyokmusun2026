// --- SECURITY LOCK & ORIGIN CHECK (GARANTİ VE ESNEK VERSİYON) ---
(function() {
    const izinliAdresler = [
        "localhost",
        "127.0.0.1",
        "keisersoze1.github.io" // Hem eski hem yeni reponu otomatik kapsar!
    ];
    
    const mevcutHost = window.location.hostname;
    const protokol = window.location.protocol;

    // Eğer yerel dosyadan (file://) doğrudan açılıyorsa veya izinli sunuculardaysa oyunu aç
    if (protokol === "file:" || izinliAdresler.includes(mevcutHost)) {
        console.log("Lisans doğrulandı. İyi oyunlar!");
    } else {
        // İZİNSİZ ADRES DURUMUNDA EKRANI KİLİTLE
        document.body.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #0f0f1a; color: #fff; font-family: 'Segoe UI', sans-serif;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                z-index: 99999; text-align: center; padding: 20px; box-sizing: border-box;
            ">
                <div style="
                    border: 2px solid #ff3333; background: rgba(255, 51, 51, 0.05);
                    padding: 40px; border-radius: 16px; max-width: 550px;
                    box-shadow: 0 0 30px rgba(255, 51, 51, 0.2);
                ">
                    <span style="font-size: 50px;">⚠️</span>
                    <h2 style="color: #ff3333; margin: 15px 0; font-size: 26px; text-transform: uppercase;">LİSANS İHLALİ DETECTED</h2>
                    <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                        Bu oyunun kaynak kodları çalınmış veya izinsiz bir adreste yayına alınmıştır.<br>
                        Lütfen orijinal ve lisanslı adresi ziyaret edin.
                    </p>
                </div>
            </div>
        `;
        throw new Error("Lisans ihlali! Kod yürütülmesi durduruldu.");
    }
})();

// --- OYUN KODLARI ---
const orijinalOduller = [
    1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000,
    25000, 50000, 100000, 250000, 500000, 750000, 1000000, 2000000, 3000000, 5000000, 5000000
];

let kalanOduller = [];
let oyuncuKutusu = null;
let acilanKutuSayisi = 0;
let turKutuLimiti = 4;
let turAcilanSayisi = 0;
let oyunBitti = false;
let teklifBekleniyor = false; 
let kutuIcerikleri = {}; 
let kutuSiralamasi = [];

const sesKutuSecme = new Audio('sounds/kutu_secme.mp3');
const sesKutuAcilma = new Audio('sounds/kutu_acilma.mp3');
const sesTelefon = new Audio('sounds/telefon_calma.mp3');

const girisEkrani = document.getElementById("giris-ekrani");
const girisKutularArea = document.getElementById("giris-kutular");
const solPanel = document.getElementById("sol-oduller");
const sagPanel = document.getElementById("sag-oduller");
const yerdekiKutularArea = document.getElementById("yerdeki-kutular");
const kendiKutunAlani = document.getElementById("kendi-kutun-alani");
const kendiKutuEtiket = document.getElementById("kendi-kutu-etiket");
const altDurumMetni = document.getElementById("alt-durum-metni");
const sunucuResim = document.getElementById("sunucu-resim");
const sunucuBalonu = document.getElementById("sunucu-balonu");
const kararEkrani = document.getElementById("karar-ekrani");
const teklifDegeriText = document.getElementById("teklif-degeri");
const bittiEkrani = document.getElementById("bitti-ekrani");
const bittiMesaji = document.getElementById("bitti-mesaji");

const bankaAriyorReplikleri = [
    "Telefon çalıyor... Banka yönetiminden arıyorlar, dur bakalım...",
    "Peki... Evet efendim... Anladım, oyuncumuza iletiyorum şimdi.",
    "Yönetim bu tur hiç acımamış, teklif çok sert gelecek gibi...",
    "Alo? Evet... Oyuncumuz gayet iddialı, bence kesenin ağzını açın.",
    "Banka arıyor! Bakalım bu tur seni masadan kaldırabilecek mi...",
    "Hattın ucunda banka var. Sesleri biraz gergin geliyor sanki?",
    "Telefon geldi. Banka senin bu cesaretin karşısında ne yapacağını şaşırdı."
];

const teklifReplikleri = [
    "Sence bu teklife 'Tamam' mı dersin, yoksa 'Devam' mı?",
    "Kararın ne? Parayı alıp gitmek mi, şansını zorlamak mı?",
    "Banka sana çok net bir yol sunuyor. Tüm ipler senin elinde!",
    "Bunu kabul edip gitmek de mantıklı bir seçenek, ne diyorsun?",
    "Kutuna mı güveniyorsun, yoksa bu garanti masadaki paraya mı?",
    "Önünde dev gibi bir teklif duruyor. Risk almaya değer mi?",
    "Düşünmek için vaktin var. İçinden gelen sesi dinle, kararın nedir?"
];

const reddetmeReplikleri = [
    "Cesaretini tebrik ederim! Hadi o zaman, kutuları açmaya devam.",
    "Banka şokta! Geri adım atmıyoruz, sıradaki kutuları seçelim.",
    "Harika bir duruş! Bakalım sonraki kutularda neler çıkacak.",
    "Kutuna sonuna kadar inanıyorsun demek! O zaman yola devam.",
    "Korkusuzca bir karar! Bankayı terletmeye devam ediyoruz.",
    "Banka bu cevabı beklemiyordu. Hadi onlara gününü gösterelim!",
    "Masadaki parayı elimin tersiyle itiyorum dedin... Yeni tur başlasın!"
];

const iyiKutuReplikleri = [
    "İşte bu! Maviler gittikçe yüzümüz gülüyor.",
    "Harika bir seçim! Bankanın uykularını kaçıracak bir hamle.",
    "Ucuz atlattık, aynen böyle devam et!",
    "Çok iyi gidiyorsun, büyük paralar hala masada güvende."
];

const kotuKutuReplikleri = [
    "Eyvah eyvah... O kutudan çıkmasa çok iyiydi.",
    "Sağlık olsun, moral bozmak yok. Masada hala büyük ödüller var!",
    "Banka şu an kıs kıs gülüyor, hemen toparlamamız lazım.",
    "Küçük bir kaza diim. Diğer kutularda şansımızı deneyeceğiz."
];

function karistir(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function balonGoster(metin, sure = 4000) {
    sunucuBalonu.innerText = metin;
    sunucuBalonu.classList.add("balon-aktif");
    setTimeout(() => {
        sunucuBalonu.classList.remove("balon-aktif");
    }, sure);
}

function odulPanelleriniCiz() {
    solPanel.innerHTML = "";
    sagPanel.innerHTML = "";
    let anlikKalan = [...kalanOduller];
    orijinalOduller.forEach((odul, index) => {
        const kart = document.createElement("div");
        kart.classList.add("odul-kart");
        if (odul <= 10000) kart.classList.add("mavi");
        else if (odul <= 500000) kart.classList.add("sari");
        else kart.classList.add("kirmizi");
        kart.innerText = `₺${odul.toLocaleString()}`;
        kart.id = `odul-kart-${index}`; 
        const kalanIndex = anlikKalan.indexOf(odul);
        if (kalanIndex > -1) {
            anlikKalan.splice(kalanIndex, 1);
        } else {
            kart.classList.add("elendi");
        }
        if (odul <= 10000) solPanel.appendChild(kart);
        else sagPanel.appendChild(kart);
    });
}

function oyunuSifirla() {
    kalanOduller = [...orijinalOduller];
    oyuncuKutusu = null;
    acilanKutuSayisi = 0;
    turKutuLimiti = 4;
    turAcilanSayisi = 0;
    oyunBitti = false;
    teklifBekleniyor = false;
    kutuIcerikleri = {};
    kendiKutunAlani.style.display = "none";
    kararEkrani.style.display = "none";
    bittiEkrani.style.display = "none";
    girisEkrani.style.opacity = "1";
    girisEkrani.style.display = "flex";
    sunucuResim.src = "images/sunucu_normal.png";
    altDurumMetni.innerText = "Yerde kalan kutulardan 4 tane aç!";
    let numaralar = [];
    for (let i = 1; i <= 22; i++) numaralar.push(i);
    kutuSiralamasi = karistir(numaralar);
    const karisikOduller = karistir([...orijinalOduller]);
    for (let i = 0; i < 22; i++) {
        kutuIcerikleri[kutuSiralamasi[i]] = karisikOduller[i];
    }
    girisKutularArea.innerHTML = "";
    kutuSiralamasi.forEach((numara) => {
        const gKutu = document.createElement("div");
        gKutu.classList.add("giris-kutu");
        const gorsel = document.createElement("div");
        gorsel.classList.add("giris-kutu-gorsel");
        const etiket = document.createElement("div");
        etiket.classList.add("kutu-numara-etiket");
        etiket.innerText = numara;
        gorsel.appendChild(etiket);
        gKutu.appendChild(gorsel);
        gKutu.addEventListener("click", () => kendiKutumuSec(numara));
        girisKutularArea.appendChild(gKutu);
    });
    odulPanelleriniCiz();
}

function kendiKutumuSec(numara) {
    sesKutuSecme.play().catch(() => {});
    oyuncuKutusu = { numara: numara, deger: kutuIcerikleri[numara] };
    girisEkrani.style.opacity = "0";
    setTimeout(() => {
        girisEkrani.style.display = "none";
    }, 500);
    kendiKutuEtiket.innerText = numara;
    kendiKutunAlani.style.display = "flex";
    yerdekiKutularArea.innerHTML = "";
    const kalanKutuNumaralari = kutuSiralamasi.filter(n => n !== numara);
    kalanKutuNumaralari.forEach((kutuNumarasi, index) => {
        const kutuNode = document.createElement("div");
        kutuNode.classList.add("yerdeki-kutu");
        kutuNode.id = `kutu-${kutuNumarasi}`;
        if (index % 7 >= 4) {
            kutuNode.classList.add("ayna-efekti");
        }
        const gorsel = document.createElement("div");
        gorsel.classList.add("kutu-gorsel");
        const etiket = document.createElement("div");
        etiket.classList.add("kutu-numara-etiket");
        etiket.innerText = kutuNumarasi;
        gorsel.appendChild(etiket);
        kutuNode.appendChild(gorsel);
        kutuNode.addEventListener("click", () => kutuTikla(kutuNumarasi, kutuNode));
        yerdekiKutularArea.appendChild(kutuNode);
    });
    setTimeout(() => {
        balonGoster(`Harika! ${numara} numaralı kutuyu masana koydum. Şimdi yerde duran o muazzam 21 kutudan ilk 4 tanesini seç bakalım!`);
    }, 1000);
}

function kutuTikla(numara, element) {
    if (oyunBitti || teklifBekleniyor) return; 
    if (element.dataset.acildi === "true") return; 
    if (numara === oyuncuKutusu.numara) return;
    element.dataset.acildi = "true";
    element.style.pointerEvents = "none"; 
    if (sesKutuAcilma) sesKutuAcilma.play().catch(() => {});
    
    const cikanPara = kutuIcerikleri[numara];
    if (cikanPara <= 10000) {
        const metin = iyiKutuReplikleri[Math.floor(Math.random() * iyiKutuReplikleri.length)];
        balonGoster(metin, 2500);
    } else if (cikanPara >= 250000) {
        const metin = kotuKutuReplikleri[Math.floor(Math.random() * kotuKutuReplikleri.length)];
        balonGoster(metin, 2500);
    }
    
    element.classList.add("kutu-aciliyor");

    // --- ANIMASYON KOORDINATLARINI %100 SABITLEME VE KUTUNUN TAM USTUNE ALMA ---
    const rect = element.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    
    // Paranın tam olarak tıkladığın kutunun merkezinden fırlamasını sağlar
    const x = rect.left - bodyRect.left + (rect.width / 2);
    const y = rect.top - bodyRect.top + (rect.height / 2);

    // Parlama Efekti
    const parlama = document.createElement("div");
    parlama.classList.add("parlaklik-efekti");
    parlama.style.position = "absolute";
    parlama.style.left = `${x - 60}px`;
    parlama.style.top = `${y - 60}px`;
    parlama.style.zIndex = "999";
    document.body.appendChild(parlama);

    // Süzülen Para Yazısı
    const süzülenYazi = document.createElement("div");
    süzülenYazi.classList.add("floating-value");
    süzülenYazi.style.position = "absolute";
    süzülenYazi.style.left = `${x - 50}px`; // Tam ortalamak için
    süzülenYazi.style.top = `${y - 20}px`;
    süzülenYazi.style.zIndex = "1000";
    süzülenYazi.innerText = `₺${cikanPara.toLocaleString()}`;
    document.body.appendChild(süzülenYazi);

    setTimeout(() => {
        // Kutuyu silmiyoruz, sadece görünmez yapıyoruz ki sağdaki barlar sola kaymasın!
        element.classList.add("kutu-acildi-sakla"); 
        parlama.remove();
        süzülenYazi.remove();
    }, 1200);

    const indexOdul = kalanOduller.indexOf(cikanPara);
    if (indexOdul > -1) kalanOduller.splice(indexOdul, 1);
    odulPanelleriniCiz();
    acilanKutuSayisi++;
    turAcilanSayisi++;
    altDurumMetni.innerText = `Bu tur açılması gereken: ${turKutuLimiti - turAcilanSayisi} kutu kaldı`;
    
    if (kalanOduller.length === 2) {
        teklifBekleniyor = true;
        setTimeout(teklifYap, 1200);
        return;
    }
    if (turAcilanSayisi === turKutuLimiti) {
        teklifBekleniyor = true;
        setTimeout(teklifYap, 1200);
    }
}

function teklifYap() {
    sesTelefon.play().catch(() => {});
    sunucuResim.src = "images/sunucu_telefonda.png";
    const rBankaMetni = bankaAriyorReplikleri[Math.floor(Math.random() * bankaAriyorReplikleri.length)];
    balonGoster(rBankaMetni, 3500);
    setTimeout(() => {
        const kalanToplam = kalanOduller.reduce((a, b) => a + b, 0);
        const ortalama = kalanToplam / kalanOduller.length;
        let katsayi = 0.12; 
        if (acilanKutuSayisi >= 7) katsayi = 0.20;  
        if (acilanKutuSayisi >= 10) katsayi = 0.34; 
        if (acilanKutuSayisi >= 13) katsayi = 0.46; 
        if (acilanKutuSayisi >= 16) katsayi = 0.64; 
        if (acilanKutuSayisi >= 18) katsayi = 0.76; 
        if (acilanKutuSayisi >= 20) katsayi = 0.90; 
        const enBuyuk = Math.max(...kalanOduller);
        const enKucuk = Math.min(...kalanOduller);
        const riskOrani = enBuyuk / (ortalama + 1);
        if (riskOrani > 3 && kalanOduller.length <= 5) {
            katsayi = katsayi * 0.85;
        }
        let teklif = ortalama * katsayi;
        if (teklif > 1000) {
            teklif = Math.round(teklif / 1000) * 1000;
        } else if (teklif > 100) {
            teklif = Math.round(teklif / 100) * 100;
        } else {
            teklif = Math.round(teklif);
        }
        if (teklif >= enBuyuk) {
            teklif = Math.round((enBuyuk * 0.75) / 1000) * 1000; 
        }
        teklifDegeriText.innerText = `₺${teklif.toLocaleString()}`;
        kararEkrani.style.display = "flex";
        const rTeklifMetni = teklifReplikleri[Math.floor(Math.random() * teklifReplikleri.length)];
        balonGoster(rTeklifMetni, 5000);
    }, 3800);
}

function kararVer(tamamMi) {
    kararEkrani.style.display = "none";
    sunucuResim.src = "images/sunucu_normal.png";
    turAcilanSayisi = 0;
    teklifBekleniyor = false; 
    if (tamamMi) {
        oyunBitti = true;
        const kazanilanBanka = teklifDegeriText.innerText;
        bittiMesaji.innerHTML = `Bankanın <strong style="color:#28a745;">${kazanilanBanka}</strong> teklifini kabul ettin!<br><br>Kendi kutundan çıksaydı kazanacağın miktar: <strong style="color:#ffcc00;">₺${oyuncuKutusu.deger.toLocaleString()}</strong> olacaktı.`;
        bittiEkrani.style.display = "flex";
        balonGoster("Tebrikler! Banka ile el sıkıştın.");
    } else {
        if (kalanOduller.length === 2) {
            oyunBitti = true;
            bittiMesaji.innerHTML = `Müthiş cesaret! Bütün teklifleri reddedip şansına güvendin.<br><br>Kutundan çıkan büyük kazancın:<br><strong style="color:#ffcc00; font-size: 36px;">₺${oyuncuKutusu.deger.toLocaleString()}</strong>`;
            bittiEkrani.style.display = "flex";
            balonGoster("Sonuna kadar gittik, kutumuzda ne varsa aldık!");
            return;
        }
        if (acilanKutuSayisi === 4) turKutuLimiti = 3;
        else if (acilanKutuSayisi === 7) turKutuLimiti = 3;
        else if (acilanKutuSayisi === 10) turKutuLimiti = 3;
        else if (acilanKutuSayisi === 13) turKutuLimiti = 3;
        else if (acilanKutuSayisi === 16) {
            turKutuLimiti = 2; 
        }
        else if (acilanKutuSayisi === 18) {
            turKutuLimiti = 2; 
        }
        altDurumMetni.innerText = `Yeni Tur: Şimdi yerde kalanlardan ${turKutuLimiti} kutu açmalısın.`;
        const rRedMetni = reddetmeReplikleri[Math.floor(Math.random() * reddetmeReplikleri.length)];
        balonGoster(rRedMetni);
    }
}

oyunuSifirla();