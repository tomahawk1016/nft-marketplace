import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, Plus, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../hooks/useWeb3';
import { uploadToIPFS, uploadMetadataToIPFS } from '../lib/ipfs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'react-hot-toast';

const Create: React.FC = () => {
  const { account, nftContract, connect } = useWeb3();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [category, setCategory] = useState("Others")
  const [step, setStep] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      toast.error('Please connect your wallet first');
      connect();
      return;
    }

    if (!file || !name || !description ) {
      toast.error('Please fill all fields ');
      return;
    }

    try {
      setIsMinting(true);
      toast.loading('Uploading to IPFS...', { id: 'mint' });

      // 1. Upload Image to IPFS
      const imageURI = await uploadToIPFS(file);

      // 2. Upload Metadata to IPFS
      const metadata = {
        name,
        description,
        image: imageURI,
        category,
      };
      const metadataURI = await uploadMetadataToIPFS(metadata);

      toast.loading('Minting NFT on blockchain...', { id: 'mint' });

      // 3. Mint on Smart Contract
      const tx = await nftContract?.mint(metadataURI);
      await tx.wait();

      toast.success('NFT minted successfully!', { id: 'mint' });
      navigate('/profile');
    } catch (error: any) {
      console.error('Minting error:', error);
      toast.error(error.reason || error.message || 'Minting failed', { id: 'mint' });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">Create New NFT</h1>
        <p className="text-muted-foreground text-lg">
          Upload your work (image, video, audio, or 3D model), add a title and description, and customize your NFT.
        </p>
      </div>

      <form onSubmit={handleMint} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Upload */}
        <div className="space-y-8">
          <div className="space-y-4">
            <Label className="text-lg font-bold">Image, Video, Audio, or 3D Model</Label>
            <p className="text-sm text-muted-foreground">File types supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF. Max size: 100 MB</p>

            <div
              className={`relative aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-secondary/20
                ${preview ? 'border-primary/50' : 'border-muted-foreground/20 hover:border-primary/50'}`}
            >
              {preview ? (
                <div className="relative h-full w-full group">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="rounded-xl"
                    >
                      Change File
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center p-12 text-center h-full w-full">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Drag and drop file</h3>
                  <p className="text-sm text-muted-foreground">or browse media on your device</p>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              )}
            </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              <h4 className="font-bold">Blockchain Fees</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Minting an NFT requires a small gas fee on the Ethereum network. Make sure you have enough ETH in your wallet to cover the transaction.
            </p>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="name" className="text-lg font-bold">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. 'Cyber Punk #4829'"
              className="rounded-xl h-12 bg-secondary/30 border-none focus-visible:ring-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="description" className="text-lg font-bold">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of your item."
              className="rounded-xl min-h-[150px] bg-secondary/30 border-none focus-visible:ring-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-3 mb-5 rounded-xl bg-white text-black border border-black/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition">
              <option disabled value="Others">Select Category</option>
              <option value="Art">Art</option>
              <option value="Gaming">Gaming</option>
              <option value="Music">Music</option>
              <option value="Photography">Photography</option>
              <option value="Collectibles">Collectibles</option>
              <option value="Domain Names">Domain Names</option>
            </select>
          </div>

          <div className="pt-8 border-t space-y-4">
            {!account ? (
              <Button type="button" onClick={() => connect()} className="w-full py-7 text-lg font-bold rounded-2xl">
                Connect Wallet to Mint
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isMinting || !file || !name}
                className="w-full py-7 text-lg font-bold rounded-2xl gap-2"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Mint NFT
                  </>
                )}
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              By clicking "Mint NFT", you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Create;
