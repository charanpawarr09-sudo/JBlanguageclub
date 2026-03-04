import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./db";
import { events as initialEvents } from "./src/data/events";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Seed Database
  try {
    const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
    if (eventCount.count === 0) {
      console.log('Seeding events...');
      const insert = db.prepare(`
        INSERT INTO events (
          id, title, description, shortDescription, date, time, location, category,
          image, banner_image, thumbnail_image, rules, teamSize, prize, rounds,
          registration_fee_single, registration_fee_team, min_team_size, max_team_size,
          google_form_url, slots_total, slots_filled, judging_criteria, coordinators,
          is_published, registration_enabled, display_order
        )
        VALUES (
          @id, @title, @description, @shortDescription, @date, @time, @location, @category,
          @image, @banner_image, @thumbnail_image, @rules, @teamSize, @prize, @rounds,
          @registration_fee_single, @registration_fee_team, @min_team_size, @max_team_size,
          @google_form_url, @slots_total, @slots_filled, @judging_criteria, @coordinators,
          @is_published, @registration_enabled, @display_order
        )
      `);

      for (const [index, event] of initialEvents.entries()) {
        insert.run({
          id: event.id,
          title: event.title,
          description: event.description,
          shortDescription: event.shortDescription,
          date: event.date,
          time: event.time,
          location: event.location,
          category: event.category,
          image: event.image,
          banner_image: event.banner_image,
          thumbnail_image: event.thumbnail_image,
          rules: JSON.stringify(event.rules),
          teamSize: event.teamSize,
          prize: event.prize,
          rounds: event.rounds ? JSON.stringify(event.rounds) : null,
          registration_fee_single: event.registration_fee_single,
          registration_fee_team: event.registration_fee_team,
          min_team_size: event.min_team_size,
          max_team_size: event.max_team_size,
          google_form_url: event.google_form_url,
          slots_total: event.slots_total,
          slots_filled: event.slots_filled,
          judging_criteria: JSON.stringify(event.judging_criteria),
          coordinators: JSON.stringify(event.coordinators),
          is_published: event.is_published ? 1 : 0,
          registration_enabled: event.registration_enabled ? 1 : 0,
          display_order: index,
        });
      }
    }

    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (settingsCount.count === 0) {
      console.log('Seeding settings...');
      const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      insert.run('hero_title', 'Voxera 2026');
      insert.run('hero_tagline', 'Unleash Your Voice. The Ultimate Language & Arts Festival.');
      insert.run('hero_image', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80');
      insert.run('contact_email', 'contact@voxera.com');
      insert.run('contact_phone', '+1 (555) 123-4567');
      insert.run('social_instagram', 'https://instagram.com');
      insert.run('social_twitter', 'https://twitter.com');
      insert.run('social_linkedin', 'https://linkedin.com');
    }
  } catch (e) {
    console.error("Seeding error:", e);
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to parse event row from DB
  const parseEventRow = (event: any) => ({
    ...event,
    rules: JSON.parse(event.rules || '[]'),
    rounds: event.rounds ? JSON.parse(event.rounds) : undefined,
    judging_criteria: JSON.parse(event.judging_criteria || '[]'),
    coordinators: JSON.parse(event.coordinators || '[]'),
    is_published: Boolean(event.is_published),
    registration_enabled: Boolean(event.registration_enabled),
  });

  // Events API
  app.get("/api/events", (req, res) => {
    try {
      const events = db.prepare('SELECT * FROM events ORDER BY display_order ASC').all();
      const parsedEvents = events.map(parseEventRow);
      res.json(parsedEvents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", (req, res) => {
    try {
      const { id } = req.params;
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(parseEventRow(event));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", (req, res) => {
    try {
      const event = req.body;
      const insert = db.prepare(`
        INSERT INTO events (
          id, title, description, shortDescription, date, time, location, category,
          image, banner_image, thumbnail_image, rules, teamSize, prize, rounds,
          registration_fee_single, registration_fee_team, min_team_size, max_team_size,
          google_form_url, slots_total, slots_filled, judging_criteria, coordinators,
          is_published, registration_enabled, display_order
        )
        VALUES (
          @id, @title, @description, @shortDescription, @date, @time, @location, @category,
          @image, @banner_image, @thumbnail_image, @rules, @teamSize, @prize, @rounds,
          @registration_fee_single, @registration_fee_team, @min_team_size, @max_team_size,
          @google_form_url, @slots_total, @slots_filled, @judging_criteria, @coordinators,
          @is_published, @registration_enabled, @display_order
        )
      `);
      insert.run({
        ...event,
        rules: JSON.stringify(event.rules || []),
        rounds: event.rounds ? JSON.stringify(event.rounds) : null,
        judging_criteria: JSON.stringify(event.judging_criteria || []),
        coordinators: JSON.stringify(event.coordinators || []),
        is_published: event.is_published ? 1 : 0,
        registration_enabled: event.registration_enabled ? 1 : 0,
        display_order: event.display_order || 0,
      });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", (req, res) => {
    try {
      const { id } = req.params;
      const event = req.body;
      const update = db.prepare(`
        UPDATE events SET 
          title = @title, description = @description, shortDescription = @shortDescription, 
          date = @date, time = @time, location = @location, category = @category, 
          image = @image, banner_image = @banner_image, thumbnail_image = @thumbnail_image,
          rules = @rules, teamSize = @teamSize, prize = @prize, rounds = @rounds,
          registration_fee_single = @registration_fee_single, registration_fee_team = @registration_fee_team,
          min_team_size = @min_team_size, max_team_size = @max_team_size,
          google_form_url = @google_form_url, slots_total = @slots_total,
          judging_criteria = @judging_criteria, coordinators = @coordinators,
          is_published = @is_published, registration_enabled = @registration_enabled,
          display_order = @display_order, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);
      update.run({
        ...event,
        id,
        rules: JSON.stringify(event.rules || []),
        rounds: event.rounds ? JSON.stringify(event.rounds) : null,
        judging_criteria: JSON.stringify(event.judging_criteria || []),
        coordinators: JSON.stringify(event.coordinators || []),
        is_published: event.is_published ? 1 : 0,
        registration_enabled: event.registration_enabled ? 1 : 0,
        display_order: event.display_order || 0,
      });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM events WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Settings API
  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM settings').all();
      const settingsObj = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const settings = req.body;
      const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      const updateMany = db.transaction((settings) => {
        for (const [key, value] of Object.entries(settings)) {
          insert.run(key, value as string);
        }
      });
      updateMany(settings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Registration Endpoint
  app.post("/api/register", (req, res) => {
    try {
      const { name, email, phone, event_id, team_members } = req.body;

      if (!name || !email || !event_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if registration is enabled for this event
      const event = db.prepare('SELECT registration_enabled FROM events WHERE id = ?').get(event_id) as { registration_enabled: number };
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (!event.registration_enabled) {
        return res.status(400).json({ error: "Registration is closed for this event" });
      }

      const insert = db.prepare(`
        INSERT INTO registrations (name, email, phone, event_id, team_members)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insert.run(name, email, phone, event_id, JSON.stringify(team_members || []));

      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Get Registrations Endpoint
  app.get("/api/registrations", (req, res) => {
    try {
      const registrations = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
      res.json(registrations);
    } catch (error: any) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
