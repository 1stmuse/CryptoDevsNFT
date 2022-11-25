// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// baseURI = https://crypto-devs-kk060x7ek-1stmuse.vercel.app/api

export default function handler(req, res) {
  const tokenId = req.query.tokenid;
  const name = `Crypto Dev 3${tokenId}`;
  const description = "NFT for great devlopers";
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${
    Number(tokenId) - 1
  }.svg`;

  res.status(200).json({
    name,
    description,
    image,
  });
}
