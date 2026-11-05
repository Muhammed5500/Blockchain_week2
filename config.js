// Deploy'dan sonra burayı doldur. Ayrıntılar: README.md
window.ROZET_CONFIG = {
  // Remix'te deploy ettiğin kontratın adresi (0x...). Boşken sayfalar "Kontrat henüz ayarlanmadı" der.
  CONTRACT_ADDRESS: "0x6b88744CbfbB6b3E4837A8b741b3A416D104440D",

  // Sepolia
  CHAIN_ID: 11155111,
  CHAIN_NAME: "Sepolia",
  // Galeri sayfası cüzdansız okur; herkese açık bir Sepolia RPC yeterli.
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  EXPLORER_URL: "https://sepolia.etherscan.io",

  // Sitenin yayınlandığı adres. Galeri bunun QR kodunu gösterir.
  MINT_URL: "https://blockchainweek2.vercel.app/",

  // Sepolia test USDC (Circle). Kaynak: developers.circle.com/stablecoins/usdc-contract-addresses
  USDC_ADDRESS: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};
