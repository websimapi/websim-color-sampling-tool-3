class ColorSamplingTool {
    constructor() {
        this.imageUpload = document.getElementById('imageUpload');
        this.dropZone = document.getElementById('dropZone');
        this.imageCanvas = document.getElementById('imageCanvas');
        this.colorPicker = document.getElementById('colorPicker');
        this.colorPalette = document.getElementById('colorPalette');
        this.ctx = this.imageCanvas.getContext('2d');

        this.setupEventListeners();
        this.loadSavedPalette();
    }

    setupEventListeners() {
        // Image Upload
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.dropZone.addEventListener('click', () => this.imageUpload.click());
        this.dropZone.addEventListener('dragover', this.preventDefaults);
        this.dropZone.addEventListener('dragenter', this.highlightDropZone.bind(this));
        this.dropZone.addEventListener('dragleave', this.unhighlightDropZone.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        
        // Add click event listener to sample colors
        this.imageCanvas.addEventListener('click', this.sampleColor.bind(this));
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightDropZone(e) {
        this.preventDefaults(e);
        this.dropZone.classList.add('drag-over');
    }

    unhighlightDropZone(e) {
        this.preventDefaults(e);
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        this.preventDefaults(e);
        this.dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    handleImageUpload(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    processImageFile(file) {
        // Validate file is an image
        if (!file || !file.type.startsWith('image/')) {
            console.error('Invalid file type');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.imageCanvas.width = img.width;
                this.imageCanvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                this.dropZone.textContent = 'Image Uploaded';
            };
            img.onerror = () => {
                console.error('Error loading image');
                this.dropZone.textContent = 'Error Loading Image';
            };
            img.src = event.target.result;
        };

        reader.onerror = (error) => {
            console.error('FileReader error', error);
        };

        reader.readAsDataURL(file);
    }

    sampleColor(e) {
        const rect = this.imageCanvas.getBoundingClientRect();
        const scaleX = this.imageCanvas.width / rect.width;
        const scaleY = this.imageCanvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        
        const color = {
            rgb: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`,
            hex: this.rgbToHex(pixel[0], pixel[1], pixel[2]),
            hsl: this.rgbToHsl(pixel[0], pixel[1], pixel[2])
        };

        this.addColorSample(color);
    }

    addColorSample(color) {
        const colorSample = document.createElement('div');
        colorSample.className = 'color-sample';
        colorSample.style.backgroundColor = color.rgb;

        const colorDetails = document.createElement('div');
        colorDetails.className = 'color-details';
        colorDetails.innerHTML = `
            RGB: ${color.rgb}<br>
            HEX: ${color.hex}<br>
            HSL: ${color.hsl}
        `;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.className = 'remove-color';
        removeBtn.addEventListener('click', () => {
            colorSample.remove();
            this.savePalette();
        });

        colorSample.appendChild(colorDetails);
        colorSample.appendChild(removeBtn);
        this.colorPalette.appendChild(colorSample);
        this.savePalette();
    }

    rgbToHex(r, g, b) {
        return `#${[r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
    }

    rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    savePalette() {
        const colors = Array.from(this.colorPalette.children).map(el => el.style.backgroundColor);
        localStorage.setItem('colorPalette', JSON.stringify(colors));
    }

    loadSavedPalette() {
        const savedColors = JSON.parse(localStorage.getItem('colorPalette') || '[]');
        savedColors.forEach(color => {
            this.addColorSample({
                rgb: color,
                hex: this.rgbToHex(...color.match(/\d+/g).map(Number)),
                hsl: this.rgbToHsl(...color.match(/\d+/g).map(Number))
            });
        });
    }
}

// Initialize the tool
document.addEventListener('DOMContentLoaded', () => {
    new ColorSamplingTool();
});