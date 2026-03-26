// ===============================
// Employee Info System (FLASK VERSION)
// ===============================

const API = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.querySelector("#employeeTable tbody");
    const addForm = document.getElementById("addEmployeeForm");
    const editForm = document.getElementById("editEmployeeForm");
    const modal = document.getElementById("editModal");
    const closeModal = document.getElementById("closeModal");
    const searchInput = document.getElementById("searchInput");

    // ===============================
    // LOAD EMPLOYEES
    // ===============================
    function loadEmployees() {
        fetch(`${API}/employees`)
        .then(res => res.json())
        .then(data => {
            tableBody.innerHTML = "";

            data.forEach(emp => {
                tableBody.innerHTML += createRow(emp);
            });
        });
    }

    // ===============================
    // CREATE ROW
    // ===============================
    function createRow(emp) {
        return `
        <tr data-id="${emp.employee_id}">
            <td class="emp-name">${emp.first_name} ${emp.last_name}</td>
            <td class="emp-position">${emp.position}</td>
            <td class="emp-status">${emp.status}</td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        </tr>
        `;
    }

    // ===============================
    // ADD EMPLOYEE
    // ===============================
    addForm?.addEventListener("submit", function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        const data = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            birthday: formData.get("birthday"),
            status: formData.get("status"),
            position: formData.get("position"),
            date_hired: formData.get("date_hired")
        };

        fetch(`${API}/employees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            loadEmployees();
            addForm.reset();
        });
    });

    // ===============================
    // TABLE ACTIONS
    // ===============================
    tableBody?.addEventListener("click", function(e) {
        const row = e.target.closest("tr");
        if (!row) return;

        const id = row.dataset.id;

        // DELETE
        if (e.target.classList.contains("delete-btn")) {
            if (!confirm("Delete this employee?")) return;

            fetch(`${API}/employees/${id}`, {
                method: "DELETE"
            })
            .then(() => loadEmployees());
        }

        // EDIT (OPEN MODAL)
        if (e.target.classList.contains("edit-btn")) {

            document.getElementById("edit_id").value = id;

            const fullName = row.querySelector(".emp-name").textContent.split(" ");

            document.getElementById("edit_first_name").value = fullName[0];
            document.getElementById("edit_last_name").value = fullName[1] || "";
            document.getElementById("edit_position").value = row.querySelector(".emp-position").textContent;
            document.getElementById("edit_status").value = row.querySelector(".emp-status").textContent;

            modal.style.display = "block";
        }
    });

    // ===============================
    // UPDATE EMPLOYEE
    // ===============================
    editForm?.addEventListener("submit", function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        const id = formData.get("id");

        const data = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            birthday: "2000-01-01",
            status: formData.get("status"),
            position: formData.get("position"),
            date_hired: "2024-01-01"
        };

        fetch(`${API}/employees/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(() => {
            loadEmployees();
            modal.style.display = "none";
        });
    });

    // ===============================
    // CLOSE MODAL
    // ===============================
    closeModal?.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // ===============================
    // SEARCH
    // ===============================
    searchInput?.addEventListener("input", function() {
        const value = this.value.toLowerCase();

        document.querySelectorAll("#employeeTable tbody tr").forEach(row => {
            const name = row.querySelector(".emp-name").textContent.toLowerCase();
            const position = row.querySelector(".emp-position").textContent.toLowerCase();

            row.style.display =
                name.includes(value) || position.includes(value)
                ? ""
                : "none";
        });
    });

    // INITIAL LOAD
    loadEmployees();
});