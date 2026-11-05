// Deploy'dan sonra burayı doldur. Ayrıntılar: README.md
window.ROZET_CONFIG = {
  // Remix'te deploy ettiğin kontratın adresi (0x...). Boşken sayfalar "Kontrat henüz ayarlanmadı" der.
  CONTRACT_ADDRESS: "0x22D2807aa0F76B78E2655F178c5bb3547013843F",

  // Sepolia
  CHAIN_ID: 11155111,
  CHAIN_NAME: "Sepolia",
  // Galeri sayfası cüzdansız okur; herkese açık bir Sepolia RPC yeterli.
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  EXPLORER_URL: "https://sepolia.etherscan.io",

  // Sitenin yayınlandığı adres. Galeri bunun QR kodunu gösterir.
  MINT_URL: "",

  // Sepolia test USDC (Circle). Kaynak: developers.circle.com/stablecoins/usdc-contract-addresses
  USDC_ADDRESS: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};
