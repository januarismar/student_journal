document.addEventListener('DOMContentLoaded', () => {
    const kelasSelect = document.getElementById('kelas-select');
    const tanggalInput = document.getElementById('tanggal-input');
    const jurnalEntriesDiv = document.getElementById('jurnal-entries');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    let allStudents = [];
    let selectedClassStudents = [];
    let selectedDate = null;

    // Initialize Flatpickr for the date input
    flatpickr(tanggalInput, {
        dateFormat: "d-m-Y",
        onChange: function(selectedDates, dateStr, instance) {
            selectedDate = dateStr;
            renderJurnalEntries();
        }
    });

    // Function to fetch student data from JSON
    async function fetchStudents() {
        try {
            const response = await fetch('students.json');
            allStudents = await response.json();
            populateKelasDropdown();
        } catch (error) {
            console.error('Error fetching student data:', error);
            alert('Gagal memuat data siswa. Silakan coba lagi.');
        }
    }

    // Function to populate the class dropdown
    function populateKelasDropdown() {
        const uniqueKelas = [...new Set(allStudents.map(student => student.kelas))];
        kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>'; // Default option
        uniqueKelas.forEach(kelas => {
            const option = document.createElement('option');
            option.value = kelas;
            option.textContent = kelas;
            kelasSelect.appendChild(option);
        });

        kelasSelect.addEventListener('change', () => {
            filterStudentsByClass(kelasSelect.value);
            renderJurnalEntries();
        });
    }

    // Function to filter students by selected class
    function filterStudentsByClass(kelas) {
        selectedClassStudents = allStudents.filter(student => student.kelas === kelas);
    }

    // Function to render journal entry fields for selected students
    function renderJurnalEntries() {
        jurnalEntriesDiv.innerHTML = ''; // Clear previous entries

        if (!selectedClassStudents.length || !selectedDate) {
            jurnalEntriesDiv.innerHTML = '<p class="info-message">Pilih kelas dan tanggal untuk memulai jurnal.</p>';
            return;
        }

        selectedClassStudents.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.classList.add('student-card');
            studentCard.setAttribute('data-nama', student.nama);
            studentCard.setAttribute('data-kelas', student.kelas);

            studentCard.innerHTML = `
                <h3>${student.nama} (${student.kelas})</h3>
                <div class="field-group">
                    <label for="kehadiran-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" >Kehadiran:</label>
                    <select id="kehadiran-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" class="kehadiran-select">
                        <option value="Hadir">Hadir</option>
                        <option value="Tidak Hadir">Tidak Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                    </select>
                </div>
                <div class="field-group">
                    <label for="sikap-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" >Sikap Siswa:</label>
                    <textarea id="sikap-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" class="sikap-textarea" rows="2" placeholder="Catatan sikap siswa..."></textarea>
                </div>
                <div class="field-group">
                    <label for="jurnal-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" >Jurnal Singkat (Nilai Kualitatif):</label>
                    <textarea id="jurnal-${student.nama.replace(/\s/g, '-')}-${student.kelas.replace(/\s/g, '-')}" class="jurnal-textarea" rows="3" placeholder="Jurnal singkat pembelajaran..."></textarea>
                </div>
            `;
            jurnalEntriesDiv.appendChild(studentCard);
        });
    }

    // Function to collect all journal data
    function collectJournalData() {
        const journalData = [];
        const studentCards = jurnalEntriesDiv.querySelectorAll('.student-card');

        studentCards.forEach(card => {
            const nama = card.getAttribute('data-nama');
            const kelas = card.getAttribute('data-kelas');
            const kehadiran = card.querySelector('.kehadiran-select').value;
            const sikap = card.querySelector('.sikap-textarea').value;
            const jurnal = card.querySelector('.jurnal-textarea').value;

            journalData.push({
                nama: nama,
                kelas: kelas,
                tanggal: selectedDate,
                kehadiran: kehadiran,
                sikap: sikap,
                jurnal: jurnal
            });
        });
        return journalData;
    }

    // Function to export data to PDF
    exportPdfBtn.addEventListener('click', () => {
        const journalData = collectJournalData();

        if (!journalData.length) {
            alert('Tidak ada data jurnal untuk diexport. Pastikan Anda telah memilih kelas dan mengisi jurnal.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(`Jurnal Harian Siswa - Kelas ${kelasSelect.value}`, 10, 15);
        doc.text(`Tanggal: ${selectedDate}`, 10, 25);

        const tableColumn = ["Nama", "Kehadiran", "Sikap Siswa", "Jurnal Singkat"];
        const tableRows = [];

        journalData.forEach(entry => {
            const studentData = [
                entry.nama,
                entry.kehadiran,
                entry.sikap,
                entry.jurnal
            ];
            tableRows.push(studentData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                valign: 'middle',
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [40, 167, 69], // Green header
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });

        doc.save(`Jurnal_Siswa_${kelasSelect.value}_${selectedDate}.pdf`);
        alert('Jurnal berhasil diexport ke PDF!');
    });

    // Initial fetch of student data
    fetchStudents();
});