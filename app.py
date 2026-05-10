from flask import Flask, request, jsonify, render_template
import sqlite3
import os

app = Flask(__name__)
DATABASE = 'database.db'

# ─── Database Setup ────────────────────────────────────────────────────────────

def get_db():
    """Connect to the SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Returns rows as dicts
    return conn

def init_db():
    """Create the expenses table if it doesn't exist."""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            title    TEXT    NOT NULL,
            amount   REAL    NOT NULL,
            category TEXT    NOT NULL,
            date     TEXT    NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Serve the main HTML page."""
    return render_template('index.html')


@app.route('/expenses', methods=['GET'])
def get_expenses():
    """Return all expenses as JSON."""
    conn = get_db()
    expenses = conn.execute(
        'SELECT * FROM expenses ORDER BY date DESC'
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in expenses])


@app.route('/expenses', methods=['POST'])
def add_expense():
    """Add a new expense."""
    data = request.get_json()

    title    = data.get('title', '').strip()
    amount   = data.get('amount')
    category = data.get('category', '').strip()
    date     = data.get('date', '').strip()

    # Basic validation
    if not title or not amount or not category or not date:
        return jsonify({'error': 'All fields are required.'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'error': 'Amount must be a positive number.'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)',
        (title, amount, category, date)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense added successfully!'}), 201


@app.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense by ID."""
    conn = get_db()
    result = conn.execute(
        'DELETE FROM expenses WHERE id = ?', (expense_id,)
    )
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        return jsonify({'error': 'Expense not found.'}), 404
    return jsonify({'message': 'Expense deleted successfully!'})


@app.route('/summary', methods=['GET'])
def get_summary():
    """Return total spending per category."""
    conn = get_db()
    rows = conn.execute(
        'SELECT category, SUM(amount) as total FROM expenses GROUP BY category'
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print("✅ Database initialized.")
    print("🚀 Starting Expense Tracker at http://127.0.0.1:5000")
    app.run(debug=True)
