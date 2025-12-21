
import React, { useState, useEffect } from 'react';
import { Product, ProductVariation, ProductVariationOption } from '../types';
import { fileToBase64 } from '../services/geminiService';
import { X, Plus, Image as ImageIcon, Trash2, Layers, Monitor, Maximize2 } from 'lucide-react';

interface ProductFormProps {
  initialProduct: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSave, onCancel }) => {
  const [product, setProduct] = useState<Product>({ 
    ...initialProduct, 
    imageFit: initialProduct.imageFit || 'cover' 
  });
  const [newVariationName, setNewVariationName] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await fileToBase64(e.target.files[i]);
        newImages.push(`data:image/png;base64,${base64}`);
      }
      setProduct(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        imageUrl: prev.imageUrl || newImages[0] // Ensure main image is set if empty
      }));
    }
  };

  const removeImage = (index: number) => {
    setProduct(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  const addVariation = () => {
    if (!newVariationName.trim()) return;
    setProduct(prev => ({
      ...prev,
      variations: [
        ...prev.variations,
        { id: Date.now().toString(), name: newVariationName, options: [] }
      ]
    }));
    setNewVariationName("");
  };

  const removeVariation = (id: string) => {
    setProduct(prev => ({
      ...prev,
      variations: prev.variations.filter(v => v.id !== id)
    }));
  };

  const addOption = (variationId: string) => {
    setProduct(prev => ({
      ...prev,
      variations: prev.variations.map(v => {
        if (v.id === variationId) {
          return {
            ...v,
            options: [...v.options, { id: Date.now().toString(), name: "New Option", priceModifier: 0 }]
          };
        }
        return v;
      })
    }));
  };

  const updateOption = (variationId: string, optionId: string, field: keyof ProductVariationOption, value: any) => {
    setProduct(prev => ({
      ...prev,
      variations: prev.variations.map(v => {
        if (v.id === variationId) {
          return {
            ...v,
            options: v.options.map(o => o.id === optionId ? { ...o, [field]: value } : o)
          };
        }
        return v;
      })
    }));
  };

  const removeOption = (variationId: string, optionId: string) => {
    setProduct(prev => ({
      ...prev,
      variations: prev.variations.map(v => {
        if (v.id === variationId) {
          return { ...v, options: v.options.filter(o => o.id !== optionId) };
        }
        return v;
      })
    }));
  };

  return (
    <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-xl text-slate-900">Edit Product</h3>
        <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product Name</label>
                <input 
                  value={product.title}
                  onChange={e => setProduct({...product, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Base Price</label>
                <input 
                  value={product.price}
                  onChange={e => setProduct({...product, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="$0.00"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea 
                  value={product.description}
                  onChange={e => setProduct({...product, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 text-sm"
                />
             </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
             <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product Images</label>
             <div className="grid grid-cols-3 gap-2">
                {product.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                    <img 
                        src={img} 
                        className={`w-full h-full ${product.imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}`} 
                        alt="product" 
                    />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={12}/>
                    </button>
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">Main</span>}
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-blue-500">
                   <ImageIcon size={24} />
                   <span className="text-xs font-bold mt-1">Add</span>
                   <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
             </div>
             
             {/* Image Display Options */}
             <div className="pt-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Image Display</label>
                <div className="flex bg-gray-100 p-1 rounded-lg w-fit border border-gray-200">
                    <button 
                        onClick={() => setProduct({...product, imageFit: 'cover'})}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${product.imageFit === 'cover' ? 'bg-white shadow text-slate-900 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Maximize2 size={12}/> Fill (Cover)
                    </button>
                    <button 
                        onClick={() => setProduct({...product, imageFit: 'contain'})}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${product.imageFit === 'contain' ? 'bg-white shadow text-slate-900 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Monitor size={12}/> Fit (Center)
                    </button>
                </div>
             </div>
          </div>
        </div>

        {/* Variations */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <label className="text-sm font-bold uppercase text-slate-700 flex items-center gap-2">
               <Layers size={16}/> Variations
            </label>
          </div>
          
          <div className="space-y-4">
             {product.variations.map(variation => (
               <div key={variation.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                     <h4 className="font-bold text-slate-800">{variation.name}</h4>
                     <button onClick={() => removeVariation(variation.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                  </div>
                  <div className="space-y-2">
                     {variation.options.map(option => (
                       <div key={option.id} className="flex gap-2 items-center">
                          <input 
                            value={option.name} 
                            onChange={e => updateOption(variation.id, option.id, 'name', e.target.value)}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="Option Name (e.g. Small)"
                          />
                          <div className="flex items-center gap-1">
                             <span className="text-xs text-slate-400">+</span>
                             <input 
                                type="number"
                                value={option.priceModifier} 
                                onChange={e => updateOption(variation.id, option.id, 'priceModifier', parseFloat(e.target.value))}
                                className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                                placeholder="0.00"
                             />
                          </div>
                          <button onClick={() => removeOption(variation.id, option.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button onClick={() => addOption(variation.id)} className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-2">
                       <Plus size={12}/> Add Option
                     </button>
                  </div>
               </div>
             ))}

             <div className="flex gap-2">
                <input 
                   value={newVariationName}
                   onChange={e => setNewVariationName(e.target.value)}
                   placeholder="e.g. Size, Color"
                   className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                   onKeyDown={e => e.key === 'Enter' && addVariation()}
                />
                <button onClick={addVariation} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">
                   Add Variation
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-2">
         <button onClick={onCancel} className="px-6 py-2 text-slate-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
         <button onClick={() => onSave(product)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Save Changes</button>
      </div>
    </div>
  );
};

export default ProductForm;