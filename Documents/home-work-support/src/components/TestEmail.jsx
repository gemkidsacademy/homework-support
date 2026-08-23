import { useEffect, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || "";
import "./TestEmail.css";

function TestEmail({ loggedInUser }) {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      setError("");

      try {
        const centerCode = loggedInUser?.center_code;

        if (!centerCode) {
          throw new Error("Admin center code is missing.");
        }

        const response = await fetch(
          `${API_BASE_URL}/homework/test-email/students/${encodeURIComponent(
            centerCode
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(loggedInUser?.access_token
                ? {
                    Authorization: `Bearer ${loggedInUser.access_token}`,
                  }
                : {}),
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Unable to load students."
          );
        }

        setStudents(data.students || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [loggedInUser]);

  const toggleStudent = (student) => {
    setSelectedStudents((current) => {
      const alreadySelected = current.some(
        (selected) => selected.id === student.id
      );

      if (alreadySelected) {
        return current.filter(
          (selected) => selected.id !== student.id
        );
      }

      return [...current, student];
    });
  };

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students);
    }
  };

  const [isSending, setIsSending] = useState(false);
const [sendMessage, setSendMessage] = useState("");
const [sendResults, setSendResults] = useState([]);

const handleSendTestEmail = async () => {
  if (selectedStudents.length === 0 || isSending) {
    return;
  }

  setIsSending(true);
  setError("");
  setSendMessage("");
  setSendResults([]);

  try {
    const centerCode = loggedInUser?.center_code;

    if (!centerCode) {
      throw new Error("Admin center code is missing.");
    }

    const response = await fetch(
      `${API_BASE_URL}/homework/test-email/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(loggedInUser?.access_token
            ? {
                Authorization: `Bearer ${loggedInUser.access_token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          center_code: centerCode,
          student_ids: selectedStudents.map(
            (student) => student.id
          ),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail || "Unable to send test emails."
      );
    }

    setSendMessage(
      data?.message ||
        `${selectedStudents.length} test email(s) processed.`
    );

    setSendResults(data?.results || []);

  } catch (sendError) {
    setError(sendError.message);
  } finally {
    setIsSending(false);
  }
};

  const allSelected =
    students.length > 0 &&
    selectedStudents.length === students.length;
  const filteredStudents = students.filter((student) =>
  (student.parent_email || "")
    .toLowerCase()
    .startsWith(studentSearch.trim().toLowerCase())
);
  return (
    <main className="test-email-page">
      <div className="test-email-container">

        <div className="test-email-header">
          <h1>Test Email</h1>

          <p>
            Select students and manually send the Homework
            Support email without using the scheduler.
          </p>

          <div className="test-email-account">
            Signed in as{" "}
            <strong>
              {loggedInUser?.username || "Administrator"}
            </strong>

            {loggedInUser?.center_code && (
              <>
                {" "}· Center{" "}
                <strong>{loggedInUser.center_code}</strong>
              </>
            )}
          </div>
        </div>

        <section className="test-email-card">

          <div className="test-email-card-header">
            <div>
              <h2>Select Students</h2>

              <p>
                Choose one or more students to receive
                the test email.
              </p>
            </div>

            <button
              type="button"
              className="test-email-select-all"
              onClick={selectAll}
              disabled={isLoading || students.length === 0}
            >
              {allSelected ? "Clear All" : "Select All"}
            </button>
          </div>

          {isLoading && (
            <p>Loading students...</p>
          )}

          {error && (
            <p className="test-email-error">
              {error}
            </p>
          )}

          {!isLoading && !error && (
            <div className="test-email-field">

              <label>
                Students
              </label>

              <div className="test-email-dropdown">

                <button
                  type="button"
                  className="test-email-dropdown-button"
                  onClick={() =>
                    setIsDropdownOpen(
                      (current) => !current
                    )
                  }
                >
                  <span>
                    {selectedStudents.length === 0
                      ? "Select students"
                      : `${selectedStudents.length} student${
                          selectedStudents.length === 1
                            ? ""
                            : "s"
                        } selected`}
                  </span>

                  <span className="dropdown-arrow">
                    {isDropdownOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="test-email-dropdown-menu">

                    <div className="test-email-search">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(event) =>
                          setStudentSearch(event.target.value)
                        }
                        placeholder="Search email..."
                        autoFocus
                      />
                    </div>

                    {filteredStudents.length === 0 ? (
                      <div className="test-email-no-results">
                        No matching emails found.
                      </div>
                    ) : (
                      filteredStudents.map((student) => {
                        const isSelected = selectedStudents.some(
                          (selected) => selected.id === student.id
                        );

                        return (
                          <label
                            key={student.id}
                            className={`test-email-option ${
                              isSelected ? "selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudent(student)}
                            />

                            <span className="test-email-option-email">
                              {student.parent_email}
                            </span>
                          </label>
                        );
                      })
                    )}

                  </div>
                )}

              </div>

            </div>
          )}

          {selectedStudents.length > 0 && (
            <div className="test-email-selected">

              <div className="selected-header">
                <strong>
                  Selected Students
                </strong>

                <span>
                  {selectedStudents.length}
                </span>
              </div>

              <div className="selected-student-list">

                {selectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="selected-student"
                  >
                    <div>
                      <strong>
                        {student.name}
                      </strong>

                      <span>
                        {student.parent_email}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleStudent(student)
                      }
                      aria-label={`Remove ${student.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}

              </div>

            </div>
          )}

          <div className="test-email-footer">

            <div className="test-email-count">
              {selectedStudents.length === 0
                ? "No students selected"
                : `${selectedStudents.length} student${
                    selectedStudents.length === 1
                      ? ""
                      : "s"
                  } selected`}
            </div>

            <button
              type="button"
              className="test-email-send-button"
              disabled={selectedStudents.length === 0}
              onClick={handleSendTestEmail}
            >
              Send Test Email
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}

export default TestEmail;