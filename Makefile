dev:
	docker-compose up

down:
	docker-compose down

db-reset:
	docker-compose down -v && docker-compose up -d postgres redis

migrate:
	cd backend && npx prisma migrate dev

seed:
	cd backend && npx ts-node prisma/seed.ts

studio:
	cd backend && npx prisma studio

logs:
	docker-compose logs -f backend
