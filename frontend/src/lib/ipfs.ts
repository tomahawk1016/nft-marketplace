import axios from 'axios';
import { PINATA_CONFIG } from './constants';

export const uploadToIPFS = async (file: File) => {
  if (!PINATA_CONFIG.JWT) {
    throw new Error('Pinata JWT not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: {
      'Content-Type': `multipart/form-data`,
      Authorization: `Bearer ${PINATA_CONFIG.JWT}`,
    },
  });

  return `ipfs://${res.data.IpfsHash}`;
};

export const uploadMetadataToIPFS = async (metadata: any) => {
  if (!PINATA_CONFIG.JWT) {
    throw new Error('Pinata JWT not configured');
  }

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_CONFIG.JWT}`,
      },
    }
  );

  return `ipfs://${res.data.IpfsHash}`;
};

export function resolveIPFS(uri: string) {
  if (!uri) return '';

  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
  }

  if (/^(Qm|bafy)/.test(uri)) {
    return `https://ipfs.io/ipfs/${uri}`;
  }
  
  return uri;
}
