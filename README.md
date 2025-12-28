# Excel AI Analyzer - RMG Intelligence Dashboard

A powerful, fully client-side Excel analysis tool that combines in-memory SQL querying with AI-powered natural language processing. Perfect for Resource Management Groups (RMG) and business analysts who need to quickly analyze data from multiple Excel files.

## 🌟 Features

### Core Capabilities

- **📊 Multi-File Upload**: Upload multiple Excel files with multiple sheets each
- **⚡ In-Memory SQL Database**: Uses SQL.js (SQLite compiled to WebAssembly) for lightning-fast queries
- **🤖 AI-Powered Natural Language Queries**: Ask questions in plain English using Google Gemini AI
- **📈 Dynamic Visualizations**: Automatic chart generation (Bar, Line, Pie, Area charts)
- **🔍 Advanced Filtering & Sorting**: AG-Grid powered data tables with powerful filtering
- **💾 Export Results**: Export query results back to Excel

### Technical Highlights

- **100% Client-Side**: All processing happens in your browser - no data leaves your machine
- **No Backend Required**: Just open and use
- **Fast Performance**: SQLite in-browser handles large datasets efficiently
- **Automatic Schema Detection**: Columns types are inferred automatically
- **Smart SQL Generation**: Gemini generates accurate SQL from natural language

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Navigate to the project directory**:

   ```bash
   cd new_claude_gemini_sql
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

5. **Configure your API key**:
   - Click on the key icon (🔑) next to the search bar
   - Enter your Gemini API key
   - The key is stored locally in your browser

## 📖 How to Use

### Step 1: Upload Your Excel Files

1. Go to the "Upload Data" tab
2. Drag and drop your Excel files (or click to browse)
3. Click "Load Data into Database"
4. All sheets from all files will be loaded into the in-memory database

### Step 2: Explore Your Data

1. Switch to the "Explore Data" tab
2. Click on any table to view its contents
3. Use the search box to filter across all columns
4. Click column headers to sort
5. Use the filter row for advanced filtering

### Step 3: Ask Questions

1. Type your question in natural language in the search bar
2. Examples:
   - "Show me all employees in the Engineering department"
   - "What is the total salary by department?"
   - "Who has the highest sales this quarter?"
   - "List all resources with more than 5 years of experience"
3. The AI will:
   - Generate the appropriate SQL query
   - Execute it against your data
   - Recommend a visualization
   - Explain the results in plain English

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    React App                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │   │
│  │  │ Excel   │  │ SQL.js  │  │ Gemini API Client  │  │   │
│  │  │ Parser  │→ │ SQLite  │← │                     │  │   │
│  │  │ (XLSX)  │  │  (WASM) │  │ Natural Language   │  │   │
│  │  └─────────┘  └─────────┘  │     → SQL          │  │   │
│  │       ↓            ↓       └─────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           UI Components                      │   │   │
│  │  │  • AG-Grid Data Tables                       │   │   │
│  │  │  • Recharts Visualizations                   │   │   │
│  │  │  • Query Interface                           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
new_claude_gemini_sql/
├── index.html              # Entry HTML file
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main application component
    ├── index.css           # Global styles
    ├── components/
    │   ├── FileUpload.jsx      # File upload with drag & drop
    │   ├── DataTable.jsx       # AG-Grid data table
    │   ├── QueryInterface.jsx  # Natural language query input
    │   ├── DynamicChart.jsx    # Dynamic chart rendering
    │   ├── SchemaExplorer.jsx  # Database schema sidebar
    │   └── ResultsPanel.jsx    # Query results display
    ├── services/
    │   ├── database.js         # SQL.js database service
    │   └── gemini.js           # Gemini AI service
    └── utils/
        └── excelParser.js      # Excel file parsing utility
```

## 🎨 Features in Detail

### Data Table (AG-Grid)

- Sort by clicking column headers
- Filter using the floating filter row
- Quick search across all columns
- Column visibility toggle
- Pagination with configurable page size
- Export to Excel

### AI Query Engine

- Natural language to SQL conversion
- Automatic visualization recommendation
- Plain English result explanation
- Query history
- Suggested questions based on your data

### Visualizations

- **Bar Chart**: Compare categories
- **Line Chart**: Show trends over time
- **Area Chart**: Cumulative trends
- **Pie Chart**: Show proportions
- Automatic axis detection
- Interactive tooltips

## ⚙️ Configuration

### Gemini API

The app uses the `gemini-2.0-flash` model by default. You can modify this in `src/services/gemini.js`:

```javascript
const MODEL_ID = "gemini-2.0-flash"; // Change to other models if needed
```

### Supported File Formats

- `.xlsx` - Excel 2007+
- `.xls` - Excel 97-2003
- `.csv` - Comma-separated values
- `.ods` - OpenDocument Spreadsheet
- `.xlsb` - Excel Binary
- `.xlsm` - Excel Macro-enabled

## 🔒 Privacy & Security

- **All data stays in your browser** - nothing is sent to any server except the Gemini API
- **Only schema and sample data** are sent to Gemini for SQL generation
- **API key stored locally** in browser localStorage
- **No cookies or tracking**

## 🐛 Troubleshooting

### "Failed to initialize database"

- Refresh the page
- Check if WebAssembly is supported in your browser

### "API Error"

- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you have API quota remaining

### Performance with Large Files

- The app handles 1000+ rows well
- For very large files (10,000+ rows), queries may take a few seconds
- Use specific filters to reduce result sets

## 📜 License

MIT License - feel free to use this for your organization!

## 🙏 Acknowledgments

- [SQL.js](https://sql.js.org/) - SQLite in JavaScript
- [Google Gemini](https://ai.google.dev/) - AI natural language processing
- [AG-Grid](https://www.ag-grid.com/) - Data grid component
- [Recharts](https://recharts.org/) - Charting library
- [SheetJS](https://sheetjs.com/) - Excel parsing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Beautiful icons
