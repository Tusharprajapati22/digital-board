# College Digital Board

## 1. Supabase
Run `supabase_setup.sql` in the SQL editor (creates the `Digitalboard` table, public `Digitalboard` bucket and upload policy).

## 2. Backend
```
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add URL + service_role key
uvicorn main:app --reload --port 8000
```

## 3. Frontend
```
cd frontend && npm install
cp .env.example .env   # add URL + anon key + API URL
npm run dev            # http://localhost:5173
```
Admin: `/admin`, password `college@123`. Replace `frontend/public/logo.svg` with your college logo.
