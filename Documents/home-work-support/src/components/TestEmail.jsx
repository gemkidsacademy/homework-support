import { useEffect, useState } from "react";
import "./TestEmail.css";

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || "";

function TestEmail({ loggedInUser }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [error, setError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [sendResults, setSendResults] = useState([]);

  const centerCode = loggedInUser?.center_code;

  // ------------------------------------
  // Load available classes
  // ------------------------------------

  useEffect(() => {
    const loadClasses = async () => {
      setIsLoadingClasses(true);
      setError("");

      try {
        if (!centerCode) {
          throw new Error("Admin center code is missing.");
        }

        const response = await fetch(
          `${API_BASE_URL}/homework-support/admin/classes?center_code=${encodeURIComponent(
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
            data?.detail || "Unable to load classes."
          );
        }

        setClasses(data.classes || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load classes.");
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();
  }, [centerCode, loggedInUser?.access_token]);

  // ------------------------------------
  // Load students when class changes
  // ------------------------------------

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSelectedStudents([]);
      setStudentSearch("");
      setIsDropdownOpen(false);
      return;
    }

    const loadStudents = async () => {
      setIsLoadingStudents(true);
      setError("");
      setSendMessage("");
      setSendResults([]);

      setStudents([]);
      setSelectedStudents([]);
      setStudentSearch("");
      setIsDropdownOpen(false);

      try {
        if (!centerCode) {
          throw new Error("Admin center code is missing.");
        }

        const response = await fetch(
          `${API_BASE_URL}/homework-support/admin/students?center_code=${encodeURIComponent(
            centerCode
          )}&class_name=${encodeURIComponent(selectedClass)}`,
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
        setError(
          loadError.message || "Unable to load students."
        );
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedClass, centerCode, loggedInUser?.access_token]);

  // ------------------------------------
  // Toggle individual student
  // ------------------------------------

  const toggleStudent = (student) => {
    setSelectedStudents((current) => {
      const alreadySelected = current.some(
        (selected) =>
          selected.student_id === student.student_id
      );

      if (alreadySelected) {
        return current.filter(
          (selected) =>
            selected.student_id !== student.student_id
        );
      }

      return [...current, student];
    });
  };

  // ------------------------------------
  // Select all students in selected class
  // ------------------------------------

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students);
    }
  };

  // ------------------------------------
  // Send test emails
  // ------------------------------------

  const handleSendTestEmail = async () => {
    if (selectedStudents.length === 0 || isSending) {
      return;
    }

    setIsSending(true);
    setError("");
    setSendMessage("");
    setSendResults([]);

    try {
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
              (student) => student.student_id
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
      setError(
        sendError.message || "Unable to send test emails."
      );
    } finally {
      setIsSending(false);
    }
  };

  // ------------------------------------
  // Search emails
  // ------------------------------------

  const filteredStudents = students.filter((student) =>
    (student.parent_email || "")
      .toLowerCase()
      .startsWith(studentSearch.trim().toLowerCase())
  );

  const allSelected =
    students.length > 0 &&
    selectedStudents.length === students.length;

  return (
    <main className="test-email-page">
      <div className="test-email-container">

        {/* Header */}

        <div className="test-email-header">
          <h1>Test Email</h1>

          <p>
            Select a class and manually send the Homework
            Support email without using the scheduler.
          </p>

          <div className="test-email-account">
            Signed in as{" "}
            <strong>
              {loggedInUser?.username || "Administrator"}
            </strong>

            {centerCode && (
              <>
                {" "}· Center{" "}
                <strong>{centerCode}</strong>
              </>
            )}
          </div>
        </div>

        {/* Main card */}

        <section className="test-email-card">

          <div className="test-email-card-header">
            <div>
              <h2>Select Class</h2>

              <p>
                Select a class to load its parent email
                addresses.
              </p>
            </div>
          </div>

          {/* Class selector */}

          <div className="test-email-field">
            <label htmlFor="test-email-class">
              Class
            </label>

            {isLoadingClasses ? (
              <p>Loading classes...</p>
            ) : (
              <select
                id="test-email-class"
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="test-email-class-select"
              >
                <option value="">
                  Select a class
                </option>

                {classes.map((classItem) => {
                  const className =
                    typeof classItem === "string"
                      ? classItem
                      : classItem.class_name;

                  const studentCount =
                    typeof classItem === "string"
                      ? null
                      : classItem.student_count;

                  return (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                      {studentCount !== null
                        ? ` (${studentCount} students)`
                        : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {error && (
            <p className="test-email-error">
              {error}
            </p>
          )}

          {/* Students for selected class */}

          {selectedClass && !error && (
            <>
              <div className="test-email-card-header">
                <div>
                  <h2>
                    Parent Emails
                  </h2>

                  <p>
                    Select parent emails for{" "}
                    <strong>{selectedClass}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  className="test-email-select-all"
                  onClick={selectAll}
                  disabled={
                    isLoadingStudents ||
                    students.length === 0
                  }
                >
                  {allSelected
                    ? "Clear All"
                    : "Select All"}
                </button>
              </div>

              {isLoadingStudents && (
                <p>Loading parent emails...</p>
              )}

              {!isLoadingStudents &&
                students.length === 0 && (
                  <p>
                    No active students found for this
                    class.
                  </p>
                )}

              {!isLoadingStudents &&
                students.length > 0 && (
                  <div className="test-email-field">

                    <label>
                      Parent Emails
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
                            ? "Select parent emails"
                            : `${selectedStudents.length} email${
                                selectedStudents.length === 1
                                  ? ""
                                  : "s"
                              } selected`}
                        </span>

                        <span className="dropdown-arrow">
                          {isDropdownOpen
                            ? "▲"
                            : "▼"}
                        </span>
                      </button>

                      {isDropdownOpen && (
                        <div className="test-email-dropdown-menu">

                          <div className="test-email-search">
                            <input
                              type="text"
                              value={studentSearch}
                              onChange={(event) =>
                                setStudentSearch(
                                  event.target.value
                                )
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
                            filteredStudents.map(
                              (student) => {
                                const isSelected =
                                  selectedStudents.some(
                                    (selected) =>
                                      selected.student_id ===
                                      student.student_id
                                  );

                                return (
                                  <label
                                    key={
                                      student.student_id
                                    }
                                    className={`test-email-option ${
                                      isSelected
                                        ? "selected"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleStudent(
                                          student
                                        )
                                      }
                                    />

                                    <span className="test-email-option-email">
                                      {student.parent_email}
                                    </span>
                                  </label>
                                );
                              }
                            )
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                )}

              {/* Selected emails */}

              {selectedStudents.length > 0 && (
                <div className="test-email-selected">

                  <div className="selected-header">
                    <strong>
                      Selected Parent Emails
                    </strong>

                    <span>
                      {selectedStudents.length}
                    </span>
                  </div>

                  <div className="selected-student-list">

                    {selectedStudents.map(
                      (student) => (
                        <div
                          key={student.student_id}
                          className="selected-student"
                        >
                          <div>
                            <strong>
                              {student.parent_email}
                            </strong>

                            <span>
                              {student.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStudent(student)
                            }
                            aria-label={`Remove ${student.parent_email}`}
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                  </div>
                </div>
              )}

              {/* Send result */}

              {sendMessage && (
                <p className="test-email-success">
                  {sendMessage}
                </p>
              )}

              {/* Footer */}

              <div className="test-email-footer">

                <div className="test-email-count">
                  {selectedStudents.length === 0
                    ? `No emails selected from ${selectedClass}`
                    : `${selectedStudents.length} email${
                        selectedStudents.length === 1
                          ? ""
                          : "s"
                      } selected from ${selectedClass}`}
                </div>

                <button
                  type="button"
                  className="test-email-send-button"
                  disabled={
                    selectedStudents.length === 0 ||
                    isSending
                  }
                  onClick={handleSendTestEmail}
                >
                  {isSending
                    ? "Sending..."
                    : "Send Test Email"}
                </button>

              </div>
            </>
          )}

        </section>

      </div>
    </main>
  );
}

export default TestEmail;