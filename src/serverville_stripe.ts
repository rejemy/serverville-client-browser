namespace sv
{

	export function makeStripeButton(server:Serverville, apiKey:string, product:ProductInfo, successUrl:string, failUrl:string):HTMLFormElement
	{
		var form:HTMLFormElement = document.createElement("form");
		form.method = "POST";
		form.action = "https://"+server.ServerHost+"/form/stripeCheckout";

		var sessionToken:HTMLInputElement = document.createElement("input");
		sessionToken.type = "hidden";
		sessionToken.name = "session_id";
		sessionToken.value = server.SessionId;
		form.appendChild(sessionToken);

		var productInput:HTMLInputElement = document.createElement("input");
		productInput.type = "hidden";
		productInput.name = "product_id";
		productInput.value = product.id;
		form.appendChild(productInput);

		var successUrlInput:HTMLInputElement = document.createElement("input");
		successUrlInput.type = "hidden";
		successUrlInput.name = "success_redirect_url";
		successUrlInput.value = successUrl;
		form.appendChild(successUrlInput);

		var failUrlInput:HTMLInputElement = document.createElement("input");
		failUrlInput.type = "hidden";
		failUrlInput.name = "fail_redirect_url";
		failUrlInput.value = failUrl;
		form.appendChild(failUrlInput);

		var script:HTMLScriptElement = document.createElement("script");
		script.classList.add("stripe-button");
		
		script.setAttribute("data-key", apiKey);
		script.setAttribute("data-amount", String(product.price));
		script.setAttribute("data-name", product.name);
		script.setAttribute("data-description", product.description);
		script.setAttribute("data-image", product.image_url);
		script.setAttribute("data-locale", "auto");
		script.setAttribute("data-zip-code", "true");
		script.setAttribute("data-billing-address", "true");

		script.src = "https://checkout.stripe.com/checkout.js";
		
		form.appendChild(script);
		
		return form;
	}

}