// oga-generator.js

function switchTab(tabName) {
    // 1. ซ่อนทุก Section
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.add('hidden');
    });

    // 2. เอาคลาส Active ออกจากทุกปุ่ม
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    // 3. แสดง Section ที่เลือก
    const activeSection = document.getElementById('content' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // 4. ไฮไลท์ปุ่มที่ถูกกด
    const activeBtn = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (activeBtn) {
        activeBtn.classList.add('tab-active');
    }
}


function runNamingTool() {
    const input = document.getElementById('mainInput').value.trim();
    if (!input) return;

    // 1. แยกคำด้วย _
    let words = input.toLowerCase().split('_');
    
    // รายการตัวย่อที่ต้องเป็นตัวพิมพ์ใหญ่ทั้งหมดตามกฎข้อ 36
    const specialAcronyms = ['uom', 'bom', 'erp', 'id'];

    // 2. แปลงแต่ละคำตามกฎ
    let processedWords = words.map(word => {
        // ถ้าเจอคำในรายการพิเศษ ให้ทำเป็นตัวพิมพ์ใหญ่ทั้งหมด
        if (specialAcronyms.includes(word.toLowerCase())) {
            return word.toUpperCase();
        }
        // ถ้าคำทั่วไป ให้ทำเป็น PascalCase (ตัวแรกใหญ่)
        return word.charAt(0).toUpperCase() + word.slice(1);
    });

    const pascalName = processedWords.join('');
    const camelName = processedWords[0].toLowerCase() + processedWords.slice(1).join('');

    // 3. แสดงผลตามมาตรฐาน OGA
    const prefixUI = document.getElementById('uiSel').value;
    const prefixSQL = document.querySelector('input[name="sqlDir"]:checked').value;
    const dataType = document.getElementById('sqlType').value;

    // UI Control: txt + PascalCase (e.g., txtUOMID)
    document.getElementById('resUI').innerText = prefixUI + pascalName;

    // SQL Variable: @v_ + vch + PascalCase (e.g., @v_vchUOMID)
    document.getElementById('resSQL').innerText = `@${prefixSQL}${dataType}${pascalName}`;

    // Private Internal: camelCase (e.g., uomID)
    document.getElementById('resPriv').innerText = camelName;

    // Method Parameter: _ + PascalCase (e.g., _UOMID)
    document.getElementById('resParam').innerText = '_' + camelName;
}
// ปรับปรุงฟังก์ชัน Copy ใน oga-generator.js
function copyToClipboard(id) {
    const el = document.getElementById(id);
    const content = el.innerText || el.value;
    
    if (!content || content === "-" || content.trim() === "") return;

    navigator.clipboard.writeText(content).then(() => {
        // สร้าง Visual Feedback (เปลี่ยนสีปุ่มชั่วคราว หรือใช้ Toast)
        const btn = event.currentTarget; // รับปุ่มที่ถูกกด
        const originalText = btn.innerHTML;
        
        btn.classList.remove('bg-emerald-500', 'bg-blue-600');
        btn.classList.add('bg-slate-700');
        btn.innerHTML = '✅ Copied!';

        setTimeout(() => {
            btn.classList.remove('bg-slate-700');
            btn.classList.add(id === 'aiResult' ? 'bg-emerald-500' : 'bg-blue-600');
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// ปรับปรุง AI Generate ให้รองรับการตรวจสอบประเภทข้อมูลที่ละเอียดขึ้นเล็กน้อย
function aiProcessCode() {
    const raw = document.getElementById('aiRawInput').value.trim();
    if(!raw) return;

    const lines = raw.split('\n');
    let output = `public class ProjectModelDto \n{\n`;

    lines.forEach(line => {
        const field = line.trim();
        if(!field) return;

        const words = field.toLowerCase().split(/[\s_-]+/);
        // จัดการเรื่องตัวย่อพิเศษ (ID, UOM, BOM, ERP) ให้เป็นตัวพิมพ์ใหญ่ตามมาตรฐาน 
        const specialAcronyms = ['id', 'uom', 'bom', 'erp'];
        const pascal = words.map(w => 
            specialAcronyms.includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
        ).join('');
        
        let type = "string";
        const lowField = field.toLowerCase();
        
        // --- ปรับ Logic ตามมาตรฐาน OGA Data Type  ---
        
        // 1. Boolean (BIT) 
        if (lowField.startsWith('is_') || lowField.startsWith('is') || lowField.startsWith('has')) {
            type = "bool";
        }
        // 2. DateTime / Date 
        else if (lowField.includes('date') || lowField.endsWith('_at')) {
            type = "DateTime";
        }
        // 3. Decimal / Float / Real 
        else if (lowField.includes('price') || lowField.includes('amt') || lowField.includes('total') || lowField.includes('dec')) {
            type = "decimal";
        }
        else if (lowField.includes('flt')) {
            type = "double";
        }
        // 4. Integer (Qty, ID) 
        else if (lowField.includes('qty') || lowField.endsWith('id') || lowField.startsWith('id_')) {
            type = "int";
        }

        output += `    public ${type} ${pascal} { get; set; }\n`;
    });

    output += `}`;
    document.getElementById('aiResult').innerText = output;
}

function resetOutputs() {
    ['resUI', 'resSQL', 'resPriv', 'resParam'].forEach(id => {
        document.getElementById(id).innerText = "-";
    });
}

window.onload = () => { switchTab('naming'); };