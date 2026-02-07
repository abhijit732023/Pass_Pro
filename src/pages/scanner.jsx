import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Rnd } from "react-rnd";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Ticket,
  Download,
  Eye,
  Image as ImageIcon,
  PlusCircle,
  Loader2,
  X,
  Type,
  Palette,
  Layout,
  Layers,
  Database,
  Phone,
  CreditCard,
  AlignCenterHorizontal,
  Lock,
  Unlock,
  Grid3X3,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Contrast,
} from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function TicketDesigner() {
  const { register, watch, setValue } = useForm({
    defaultValues: {
      name: "VIP Gala 2024",
      mobile_number: "",
      status: "unscanned",
      startNumber: 1,
      numTickets: 10,
      widthInch: 5,
      heightInch: 2.5,
      payment_status: "Unpaid",
      ticket_prefix: "TKT-",
      // Advanced Layout Defaults
      ticketRadius: 8,
      borderWidth: 0,
      borderColor: "#000000",
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      showGrid: true,
      isLocked: false,
      // Advanced Style Defaults
      fontSize: 16,
      fontColor: "#000000",
      fontWeight: "700",
      textAlign: "left",
      fontUpper: false,
      qrColor: "#000000",
      qrBg: "#ffffff",
      qrLevel: "M", // Error Correction: L, M, Q, H
      showName: true,
      showNumber: true,
    },
  });

  const [templateImage, setTemplateImage] = useState(null);
  const [activeTab, setActiveTab] = useState("layout");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");

  const [qrPos, setQrPos] = useState({ x: 20, y: 20, size: 80 });
  const [namePos, setNamePos] = useState({ x: 120, y: 20, width: 200 });
  const [numPos, setNumPos] = useState({ x: 120, y: 60, width: 100 });

  const [previewTickets, setPreviewTickets] = useState([]);
  const [layoutInfo, setLayoutInfo] = useState({
    perRow: 1,
    perCol: 1,
    perPage: 1,
  });
  // const [ticketId, setTicketId] = useState("");

  const values = watch();
  const imageSizePx = {
    width: values.widthInch * 96,
    height: values.heightInch * 96,
  };

  // Helper: Center layer horizontally
  const centerLayer = (layer) => {
    const canvasWidth = imageSizePx.width;
    if (layer === "qr")
      setQrPos((p) => ({ ...p, x: canvasWidth / 2 - p.size / 2 }));
    if (layer === "name")
      setNamePos((p) => ({ ...p, x: canvasWidth / 2 - p.width / 2 }));
    if (layer === "num")
      setNumPos((p) => ({ ...p, x: canvasWidth / 2 - p.width / 2 }));
  };
  const handleGenerate = () => {
    const id = Array.from(crypto.getRandomValues(new Uint8Array(36)))
      .map((n) => n % 10)
      .join("");

    return id;
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setTemplateImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onPreview = () => {
    const tW = values.widthInch * 25.4;
    const tH = values.heightInch * 25.4;
    const perRow = Math.max(1, Math.floor((210 - 20) / tW));
    const perCol = Math.max(1, Math.floor((297 - 20) / tH));
    setLayoutInfo({ perRow, perCol, perPage: perRow * perCol });
    setPreviewTickets(
      Array.from({ length: Math.min(values.numTickets, perRow * perCol) }),
    );
    setShowPreview(true);
  };

  const syncTicketsToBackend = async (ticketsArray) => {
    setSyncStatus("syncing");
    try {
      console.log(ticketsArray);

      await axios.post(
        "https://balajidryfruits.com/scanner_admin/create_QR.php",
        { action: "insert", tickets: ticketsArray },
        { headers: { "Content-Type": "application/json" } },
      );
      setSyncStatus("success");
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus("error");
    }
  };

  const onGeneratePDF = async () => {
    if (!templateImage) return alert("Please upload a template!");
    setIsGenerating(true);
    const pdf = new jsPDF("p", "mm", "a4");
    let currentNumber = Number(values.startNumber);
    const allTicketsData = [];

    try {
      const pages = Math.ceil(values.numTickets / layoutInfo.perPage);
      for (let page = 0; page < pages; page++) {
        const pageContainer = document.createElement("div");
        pageContainer.style.cssText = `
          width: 794px; height: 1123px; background: white; padding: 30px;
          display: grid; gap: 10px; position: fixed; top: -9999px; left: -9999px;
          grid-template-columns: repeat(${layoutInfo.perRow}, ${imageSizePx.width}px);
        `;
        document.body.appendChild(pageContainer);
        const itemsOnPage = Math.min(
          layoutInfo.perPage,
          values.numTickets - page * layoutInfo.perPage,
        );

        for (let t = 0; t < itemsOnPage; t++) {
          const ticket_id = handleGenerate();
          const fullTicketNumber = `${values.ticket_prefix}${currentNumber}`;
          allTicketsData.push({
            action: "insert",
            name: values.name,
            mobile_number: values.mobile_number,
            ticket_number: fullTicketNumber,
            ticket_id: ticket_id,
            status: "unscanned",
            // number_of_ticket: 1,
            payment_status: values.payment_status,
          });

          const wrapper = document.createElement("div");
          wrapper.style.cssText = `
            width:${imageSizePx.width}px; height:${imageSizePx.height}px; 
            position:relative; overflow:hidden; border-radius:${values.ticketRadius}px;
            border:${values.borderWidth}px solid ${values.borderColor};
          `;

          const bg = document.createElement("img");
          bg.src = templateImage;
          bg.style.cssText = `width:100%; height:100%; object-fit:cover; filter: brightness(${values.brightness}%) contrast(${values.contrast}%) grayscale(${values.grayscale}%)`;
          wrapper.appendChild(bg);

          const qrImg = document.createElement("img");
          qrImg.src = await QRCodeLib.toDataURL(
            JSON.stringify({
              ticket_number: fullTicketNumber,
              name: values.name,
              mobile_number: values.mobile_number,
              ticket_id: ticket_id,
            }),
            {
              errorCorrectionLevel: values.qrLevel,
              color: { dark: values.qrColor, light: values.qrBg },
            },
          );
          qrImg.style.cssText = `position:absolute; left:${qrPos.x}px; top:${qrPos.y}px; width:${qrPos.size}px; height:${qrPos.size}px;`;
          wrapper.appendChild(qrImg);

          const sharedTextStyle = `
            position:absolute; color:${values.fontColor}; font-size:${values.fontSize}px; 
            font-weight:${values.fontWeight}; text-align:${values.textAlign}; 
            text-transform:${values.fontUpper ? "uppercase" : "none"}; font-family:sans-serif;
          `;

          if (values.showName) {
            const nameEl = document.createElement("div");
            nameEl.innerText = values.name;
            nameEl.style.cssText = `${sharedTextStyle} left:${namePos.x}px; top:${namePos.y}px; width:${namePos.width}px;`;
            wrapper.appendChild(nameEl);
          }

          if (values.showNumber) {
            const numEl = document.createElement("div");
            numEl.innerText = fullTicketNumber;
            numEl.style.cssText = `${sharedTextStyle} left:${numPos.x}px; top:${numPos.y}px; width:${numPos.width}px;`;
            wrapper.appendChild(numEl);
          }
          pageContainer.appendChild(wrapper);
          currentNumber++;
        }
        const canvas = await html2canvas(pageContainer, { scale: 2 });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
        if (page < pages - 1) pdf.addPage();
        document.body.removeChild(pageContainer);
      }
      await syncTicketsToBackend(allTicketsData);
      pdf.save(`${values.name}-Batch.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Ticket className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">PassStudio Pro</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${syncStatus === "success" ? "bg-green-500" : "bg-slate-300"}`}
                />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Sync: {syncStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setValue("showGrid", !values.showGrid)}
              className={`p-2 rounded-lg transition ${values.showGrid ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={onPreview}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg transition border border-indigo-100"
            >
              <Eye size={18} /> Preview
            </button>
            <button
              onClick={onGeneratePDF}
              disabled={isGenerating || !templateImage}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg shadow-md disabled:opacity-50 transition-all active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              <span>{isGenerating ? "Processing..." : "Export & Sync"}</span>
            </button>
            <button className="px-5 py-2 bg-emerald-400 rounded-lg text-white font-bold disabled:opacity-50 transition-all active:scale-95 ">
              <Link to={"table"}>Table</Link>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden sticky top-24">
            <div className="flex border-b bg-slate-50">
              {[
                { id: "layout", icon: Layout, label: "Layout" },
                { id: "style", icon: Palette, label: "Style" },
                { id: "content", icon: Database, label: "Data" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-3 text-[10px] font-bold uppercase transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <tab.icon size={18} className="mb-1" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {activeTab === "layout" && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="relative group border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 cursor-pointer text-center">
                    <PlusCircle className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Change Background
                    </span>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleTemplateUpload}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        Width (In)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register("widthInch")}
                        className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        Height (In)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register("heightInch")}
                        className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                        Corner Radius
                      </label>
                      <span className="text-xs font-bold">
                        {values.ticketRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      {...register("ticketRadius")}
                      className="w-full accent-indigo-600"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Border
                        </label>
                        <input
                          type="number"
                          {...register("borderWidth")}
                          className="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Border Color
                        </label>
                        <input
                          type="color"
                          {...register("borderColor")}
                          className="w-full h-8 mt-1 p-0.5 border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t">
                    <label className="text-[10px] font-black text-slate-400 uppercase">
                      Image FX
                    </label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Brightness</span>
                        <span>{values.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        {...register("brightness")}
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Grayscale</span>
                        <span>{values.grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        {...register("grayscale")}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "style" && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">
                      Typography
                    </label>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setValue("textAlign", "left")}
                        className={`p-2 flex-1 border rounded ${values.textAlign === "left" ? "bg-indigo-600 text-white" : "bg-white"}`}
                      >
                        <AlignLeft size={16} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => setValue("textAlign", "center")}
                        className={`p-2 flex-1 border rounded ${values.textAlign === "center" ? "bg-indigo-600 text-white" : "bg-white"}`}
                      >
                        <AlignCenter size={16} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => setValue("textAlign", "right")}
                        className={`p-2 flex-1 border rounded ${values.textAlign === "right" ? "bg-indigo-600 text-white" : "bg-white"}`}
                      >
                        <AlignRight size={16} className="mx-auto" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        {...register("fontWeight")}
                        className="border rounded-lg p-2 text-xs"
                      >
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                      </select>
                      <button
                        onClick={() => setValue("fontUpper", !values.fontUpper)}
                        className={`border rounded-lg text-[10px] font-bold ${values.fontUpper ? "bg-indigo-600 text-white" : "bg-white"}`}
                      >
                        UPPERCASE
                      </button>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                      QR Scannability
                    </label>
                    <select
                      {...register("qrLevel")}
                      className="w-full border rounded-lg p-2 text-xs mb-3"
                    >
                      <option value="L">Low (Smallest Size)</option>
                      <option value="M">Medium (Recommended)</option>
                      <option value="Q">Quartile (Safe)</option>
                      <option value="H">High (Best for damage)</option>
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase">
                          QR Color
                        </label>
                        <input
                          type="color"
                          {...register("qrColor")}
                          className="w-full h-8 p-1 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase">
                          QR Bg
                        </label>
                        <input
                          type="color"
                          {...register("qrBg")}
                          className="w-full h-8 p-1 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Lock Layers
                    </span>
                    <button
                      onClick={() => setValue("isLocked", !values.isLocked)}
                      className={`p-2 rounded-lg ${values.isLocked ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-500"}`}
                    >
                      {values.isLocked ? (
                        <Lock size={16} />
                      ) : (
                        <Unlock size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Name
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Mobile
                    </label>
                    <input
                      type="text"
                      {...register("mobile_number")}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Prefix
                      </label>
                      <input
                        type="text"
                        {...register("ticket_prefix")}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Start No
                      </label>
                      <input
                        type="number"
                        {...register("startNumber")}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Total
                      </label>
                      <input
                        type="number"
                        {...register("numTickets")}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Payment
                      </label>
                      <select
                        {...register("payment_status")}
                        className="w-full border rounded-lg px-3 py-2 bg-white text-sm"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("showName")}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm font-medium">Render Name</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("showNumber")}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm font-medium">
                        Render Ticket #
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border shadow-xl overflow-hidden h-full flex flex-col min-h-[600px]">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => centerLayer("qr")}
                  className="px-2 py-1 bg-white border rounded text-[8px] font-bold hover:bg-slate-50"
                >
                  CENTER QR
                </button>
                <button
                  onClick={() => centerLayer("name")}
                  className="px-2 py-1 bg-white border rounded text-[8px] font-bold hover:bg-slate-50"
                >
                  CENTER NAME
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                DESIGNER VIEW
              </span>
            </div>

            <div
              className={`flex-1 bg-slate-200 relative overflow-auto p-12 flex items-start justify-center ${values.showGrid ? "pattern-grid" : ""}`}
            >
              <div
                id="designer-canvas"
                className="relative shadow-2xl transition-all duration-300 bg-white"
                style={{
                  width: imageSizePx.width,
                  height: imageSizePx.height,
                  borderRadius: `${values.ticketRadius}px`,
                  border: `${values.borderWidth}px solid ${values.borderColor}`,
                  minWidth: imageSizePx.width,
                }}
              >
                {templateImage ? (
                  <img
                    src={templateImage}
                    alt="template"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{
                      filter: `brightness(${values.brightness}%) contrast(${values.contrast}%) grayscale(${values.grayscale}%)`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100">
                    <ImageIcon size={64} strokeWidth={1} />
                    <p className="mt-4 font-black uppercase text-[10px]">
                      Upload Template
                    </p>
                  </div>
                )}

                <Rnd
                  size={{ width: qrPos.size, height: qrPos.size }}
                  position={{ x: qrPos.x, y: qrPos.y }}
                  disableDragging={values.isLocked}
                  onDragStop={(e, d) => setQrPos({ ...qrPos, x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) =>
                    setQrPos({
                      ...qrPos,
                      x: pos.x,
                      y: pos.y,
                      size: ref.offsetWidth,
                    })
                  }
                  bounds="parent"
                  lockAspectRatio
                  className="z-30 group"
                >
                  <div
                    className={`w-full h-full p-1 bg-white ${values.isLocked ? "" : "ring-2 ring-indigo-500 cursor-move"}`}
                  >
                    <QRCode
                      value="preview"
                      size={qrPos.size}
                      fgColor={values.qrColor}
                      bgColor={values.qrBg}
                      level={values.qrLevel}
                      className="w-full h-full"
                    />
                  </div>
                </Rnd>

                {values.showName && (
                  <Rnd
                    size={{ width: namePos.width, height: "auto" }}
                    position={{ x: namePos.x, y: namePos.y }}
                    disableDragging={values.isLocked}
                    onDragStop={(e, d) =>
                      setNamePos({ ...namePos, x: d.x, y: d.y })
                    }
                    onResizeStop={(e, dir, ref, delta, pos) =>
                      setNamePos({
                        ...namePos,
                        x: pos.x,
                        y: pos.y,
                        width: ref.offsetWidth,
                      })
                    }
                    bounds="parent"
                    className="z-20 group"
                  >
                    <div
                      style={{
                        color: values.fontColor,
                        fontSize: `${values.fontSize}px`,
                        fontWeight: values.fontWeight,
                        textAlign: values.textAlign,
                        textTransform: values.fontUpper ? "uppercase" : "none",
                      }}
                      className={`p-1 ${values.isLocked ? "" : "border-2 border-dashed border-blue-400 cursor-move"}`}
                    >
                      {values.name}
                    </div>
                  </Rnd>
                )}

                {values.showNumber && (
                  <Rnd
                    size={{ width: numPos.width, height: "auto" }}
                    position={{ x: numPos.x, y: numPos.y }}
                    disableDragging={values.isLocked}
                    onDragStop={(e, d) =>
                      setNumPos({ ...numPos, x: d.x, y: d.y })
                    }
                    onResizeStop={(e, dir, ref, delta, pos) =>
                      setNumPos({
                        ...numPos,
                        x: pos.x,
                        y: pos.y,
                        width: ref.offsetWidth,
                      })
                    }
                    bounds="parent"
                    className="z-20 group"
                  >
                    <div
                      style={{
                        color: values.fontColor,
                        fontSize: `${values.fontSize}px`,
                        fontWeight: values.fontWeight,
                        textAlign: values.textAlign,
                      }}
                      className={`p-1 ${values.isLocked ? "" : "border-2 border-dashed border-pink-400 cursor-move"}`}
                    >
                      {values.ticket_prefix}
                      {values.startNumber}
                    </div>
                  </Rnd>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Layout Preview</h2>
                <p className="text-sm text-slate-500">
                  {layoutInfo.perPage} items per sheet
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-12 bg-slate-200/50 flex justify-center">
              <div
                className="bg-white shadow-2xl p-10 grid gap-4 place-items-center"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  gridTemplateColumns: `repeat(auto-fit, ${imageSizePx.width}px)`,
                }}
              >
                {[...Array(Math.min(6, values.numTickets))].map((_, idx) => (
                  <div
                    key={idx}
                    className="relative shadow-sm overflow-hidden"
                    style={{
                      width: imageSizePx.width,
                      height: imageSizePx.height,
                      borderRadius: `${values.ticketRadius}px`,
                      border: `${values.borderWidth}px solid ${values.borderColor}`,
                    }}
                  >
                    {templateImage && (
                      <img
                        src={templateImage}
                        className="w-full h-full object-cover"
                        style={{
                          filter: `brightness(${values.brightness}%) contrast(${values.contrast}%) grayscale(${values.grayscale}%)`,
                        }}
                      />
                    )}
                    <div
                      className="absolute bg-white p-0.5"
                      style={{
                        left: qrPos.x,
                        top: qrPos.y,
                        width: qrPos.size,
                        height: qrPos.size,
                      }}
                    >
                      <QRCode
                        value="sample"
                        size={qrPos.size}
                        fgColor={values.qrColor}
                        bgColor={values.qrBg}
                        level={values.qrLevel}
                        className="w-full h-full"
                      />
                    </div>
                    {values.showName && (
                      <div
                        style={{
                          position: "absolute",
                          left: namePos.x,
                          top: namePos.y,
                          width: namePos.width,
                          color: values.fontColor,
                          fontSize: `${values.fontSize}px`,
                          fontWeight: values.fontWeight,
                          textAlign: values.textAlign,
                          textTransform: values.fontUpper
                            ? "uppercase"
                            : "none",
                        }}
                      >
                        {values.name}
                      </div>
                    )}
                    {values.showNumber && (
                      <div
                        style={{
                          position: "absolute",
                          left: numPos.x,
                          top: numPos.y,
                          width: numPos.width,
                          color: values.fontColor,
                          fontSize: `${values.fontSize}px`,
                          fontWeight: values.fontWeight,
                          textAlign: values.textAlign,
                        }}
                      >
                        {values.ticket_prefix}
                        {Number(values.startNumber) + idx}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-8 py-3 rounded-xl font-bold text-slate-600 border bg-white"
              >
                Cancel
              </button>
              <button
                onClick={onGeneratePDF}
                className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-xl"
              >
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .pattern-grid {
          background-image: radial-gradient(#cbd5e1 0.8px, transparent 0.8px);
          background-size: 24px 24px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
